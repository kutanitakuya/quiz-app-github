"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/src/lib/firebase";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  LinearProgress,
  Stack,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";

type ParticipantResult = { userId: string; name: string; correctCount: number };

const correctPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.45); }
  100% { box-shadow: 0 0 0 12px rgba(76, 175, 80, 0); }
`;

const wrongShake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
`;

const backgroundDrift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const floatingOrb = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(18px); }
`;

const ParticipantContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [quizId, setQuizId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState("");
  const [control, setControl] = useState<any>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [question, setQuestion] = useState<any>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [counts, setCounts] = useState<number[]>([]);
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [overlayMessage, setOverlayMessage] = useState<"correct" | "wrong" | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const prevShowAnswerCheckRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeAnimRef = useRef<number | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const showAnswerCheck = Boolean(control?.showAnswerCheck);
  const correctChoiceIndex = question?.answer ?? null;
  const correctChoiceText =
    correctChoiceIndex && question?.choices?.[correctChoiceIndex - 1]
      ? question.choices[correctChoiceIndex - 1].text
      : "";
  const isUserCorrect =
    showAnswerCheck && selectedChoice != null && selectedChoice === correctChoiceIndex;
  const currentQuestionNumber =
    control?.currentQuestionIndex != null ? control.currentQuestionIndex + 1 : null;

  useEffect(() => {
    const param = searchParams.get("quiz");
    setQuizId(param);
  }, [searchParams]);

  useEffect(() => {
    if (!quizId) {
      setQuizTitle("");
      return;
    }
    const quizRef = doc(db, "quizzes", quizId);
    const unsubscribe = onSnapshot(quizRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { title?: string };
        setQuizTitle(data.title ?? "");
      } else {
        setQuizTitle("");
      }
    });
    return () => unsubscribe();
  }, [quizId]);

  const userStorageKey = useMemo(
    () => (quizId ? `quiz_${quizId}_userId` : null),
    [quizId]
  );
  const nameStorageKey = useMemo(
    () => (quizId ? `quiz_${quizId}_name` : null),
    [quizId]
  );

  useEffect(() => {
    setControl({});
    setQuestions([]);
    setQuestion(null);
    setSelectedChoice(null);
    setSubmitted(false);
    setCounts([]);
    setResults([]);
    setTimeLeft(null);
    if (!quizId) {
      setUserId("");
      setName("");
      return;
    }
    if (typeof window === "undefined") return;
    const storedId = userStorageKey ? localStorage.getItem(userStorageKey) : null;
    const storedName = nameStorageKey ? localStorage.getItem(nameStorageKey) : null;
    if (storedId) setUserId(storedId);
    if (storedName) setName(storedName);
  }, [quizId, userStorageKey, nameStorageKey]);

  useEffect(() => {
    if (!quizId) return;
    const controlRef = doc(db, "quizControl", quizId);
    const unsubscribe = onSnapshot(controlRef, (snap) => {
      setControl(snap.exists() ? snap.data() : {});
    });
    return () => unsubscribe();
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;
    const q = query(
      collection(db, "questions"),
      where("ownerId", "==", quizId),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [quizId]);

  useEffect(() => {
    if (
      !control ||
      typeof control?.currentQuestionIndex !== "number" ||
      control.currentQuestionIndex >= questions.length
    ) {
      setQuestion(null);
      return;
    }
    setQuestion(questions[control.currentQuestionIndex]);
  }, [control, questions]);

  useEffect(() => {
    setSelectedChoice(null);
    setSubmitted(false);
    setCounts([]);
    setTimeLeft(null);
  }, [question?.id]);

  useEffect(() => {
    if (!control?.showAnswerCounts) {
      setCounts([]);
    }
  }, [control?.showAnswerCounts]);

  const handleJoin = async () => {
    if (!quizId) {
      setJoinError("主催者から共有されたリンクを使用してください。");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setJoinError("名前を入力してください。");
      return;
    }
    const randomSuffix =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    const participantId = `${quizId}_${randomSuffix}`;
    try {
      await setDoc(doc(db, "participants", participantId), {
        name: trimmed,
        quizId,
        ownerId: quizId,
        joinedAt: serverTimestamp(),
      });
      setUserId(participantId);
      setJoinError(null);
      if (userStorageKey) localStorage.setItem(userStorageKey, participantId);
      if (nameStorageKey) localStorage.setItem(nameStorageKey, trimmed);
    } catch (e) {
      console.error(e);
      setJoinError("参加処理に失敗しました。時間を置いて再度お試しください。");
    }
  };

  useEffect(() => {
    if (!quizId || !userId || !question?.id) return;
    const answerId = `${quizId}_${question.id}_${userId}`;
    const ref = doc(db, "answers", answerId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSubmitted(true);
        if (typeof data.choice === "number") setSelectedChoice(data.choice);
      } else {
        setSubmitted(false);
        setSelectedChoice(null);
      }
    });
    return () => unsub();
  }, [quizId, userId, question?.id]);

  const handleChoiceToggle = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    if (submitted || (timeLeft !== null && timeLeft <= 0)) return;
    setSelectedChoice(newValue);
  };

  const handleSubmit = async () => {
    if (!quizId || !question || selectedChoice == null || !userId) return;
    if (timeLeft !== null && timeLeft <= 0) return;
    const answerId = `${quizId}_${question.id}_${userId}`;
    try {
      await setDoc(doc(db, "answers", answerId), {
        quizId,
        ownerId: quizId,
        userId,
        questionId: question.id,
        choice: selectedChoice,
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!quizId || !control?.showAnswerCounts || !question) return;
    (async () => {
      const ansQ = query(
        collection(db, "answers"),
        where("quizId", "==", quizId),
        where("questionId", "==", question.id)
      );
      const snap = await getDocs(ansQ);
      const cnts = question.choices.map(() => 0);
      snap.docs.forEach((d) => {
        const ch = d.data().choice;
        if (typeof ch === "number") cnts[ch - 1] += 1;
      });
      setCounts(cnts);
    })();
  }, [quizId, control?.showAnswerCounts, question]);

  useEffect(() => {
    if (!quizId || !control?.showResult) return;

    (async () => {
      const partSnap = await getDocs(
        query(collection(db, "participants"), where("quizId", "==", quizId))
      );
      const users = partSnap.docs.map((d) => ({
        userId: d.id,
        name: (d.data().name as string) ?? "名無し",
      }));

      const ansSnap = await getDocs(
        query(collection(db, "answers"), where("quizId", "==", quizId))
      );
      const answers = ansSnap.docs.map((d) => ({
        userId: d.data().userId as string,
        questionId: d.data().questionId as string,
        choice: d.data().choice as number,
      }));

      const answerMap = Object.fromEntries(
        questions.map((q) => [q.id, q.answer])
      );

      const countMap: Record<string, number> = {};
      answers.forEach((a) => {
        if (a.choice === answerMap[a.questionId]) {
          countMap[a.userId] = (countMap[a.userId] || 0) + 1;
        }
      });

      const ranked = users
        .map((u) => ({
          ...u,
          correctCount: countMap[u.userId] || 0,
        }))
        .sort((a, b) => b.correctCount - a.correctCount);

      setResults(ranked);
    })();
  }, [quizId, control?.showResult, questions]);

  useEffect(() => {
    if (timeAnimRef.current) {
      cancelAnimationFrame(timeAnimRef.current);
      timeAnimRef.current = null;
    }
    if (!control?.isAnswerStarted || !control?.answerStartAt || !question?.duration) {
      setTimeLeft(null);
      return;
    }
    const duration = question.duration;
    const startedAt = control.answerStartAt.toDate().getTime();

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0 && control?.isAnswerStarted) {
        timeAnimRef.current = requestAnimationFrame(tick);
      } else {
        timeAnimRef.current = null;
      }
    };

    timeAnimRef.current = requestAnimationFrame(tick);

    return () => {
      if (timeAnimRef.current) {
        cancelAnimationFrame(timeAnimRef.current);
        timeAnimRef.current = null;
      }
    };
  }, [control?.isAnswerStarted, control?.answerStartAt?.seconds, question?.duration]);

  const isTimeUp = timeLeft !== null && timeLeft <= 0;
  const shouldShowChoices =
    control?.isAnswerStarted || control?.showAnswerCheck || control?.showAnswerCounts || control?.showResult;
  const isSubmitDisabled =
    submitted || selectedChoice == null || isTimeUp || !control?.isAnswerStarted;
  const submitButtonLabel = submitted
    ? "回答済み"
    : isTimeUp
      ? "時間切れ"
      : control?.isAnswerStarted
        ? "回答を送信"
        : "回答受付待ち";
  const progressPercent = question?.duration
    ? Math.max(0, Math.min(100, (timeLeft != null ? timeLeft : question.duration) / question.duration * 100))
    : 0;
  const rankedResults = useMemo(
    () => [...results].sort((a, b) => b.correctCount - a.correctCount),
    [results]
  );

  useEffect(() => {
    const prev = prevShowAnswerCheckRef.current;
    prevShowAnswerCheckRef.current = showAnswerCheck;

    if (showAnswerCheck && !prev && selectedChoice != null) {
      const type = isUserCorrect ? "correct" : "wrong";
      setOverlayMessage(type);
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => setIsOverlayVisible(true));
      } else {
        setIsOverlayVisible(true);
      }
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsOverlayVisible(false);
        hideTimeoutRef.current = null;
      }, 2200);
    } else if (!showAnswerCheck && prev) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsOverlayVisible(false);
    }
  }, [showAnswerCheck, selectedChoice, isUserCorrect]);

  useEffect(() => () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!control?.showResult || !rankedResults.length) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(0);
    let revealed = 0;

    const scheduleNext = () => {
      if (revealed >= rankedResults.length) return;
      const delay = revealed < 3 ? 1000 : 2000;
      timer = setTimeout(() => {
        revealed += 1;
        setRevealedCount((prev) => Math.min(rankedResults.length, prev + 1));
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [control?.showResult, rankedResults.length]);

  if (!quizId) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack gap={3}>
          <Typography variant="h5">参加用リンクが無効です</Typography>
          <Typography>
            主催者から共有されたリンクを再度開いてください。URL の
            <code>?quiz=...</code>
            が不足している可能性があります。
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        background: "linear-gradient(-45deg, rgba(63,81,181,0.18), rgba(0,188,212,0.18), rgba(255,167,38,0.18), rgba(156,39,176,0.18))",
        backgroundSize: "400% 400%",
        animation: `${backgroundDrift} 18s ease infinite`,
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 55%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          bgcolor: "primary.main",
          opacity: 0.18,
          filter: "blur(60px)",
          top: { xs: -90, md: -120 },
          right: { xs: -120, md: -160 },
          animation: `${floatingOrb} 16s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          bgcolor: "secondary.main",
          opacity: 0.15,
          filter: "blur(60px)",
          bottom: { xs: -80, md: -100 },
          left: { xs: -100, md: -140 },
          animation: `${floatingOrb} 20s ease-in-out infinite`,
          animationDelay: "-6s",
          pointerEvents: "none",
        }}
      />
      <Container
        maxWidth="md"
        sx={{
          position: "relative",
          zIndex: 1,
          my: { xs: 4, md: 6 },
          py: { xs: 4, md: 5 },
          px: { xs: 3, md: 6 },
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(255,255,255,0.86)",
          borderRadius: 4,
          boxShadow: (theme) => theme.shadows[10],
        }}
      >
        <Stack gap={3}>
        <Typography variant="h4" align="center" sx={{ whiteSpace: "pre-line" }}>
          {quizTitle || "クイズに参加する"}
        </Typography>

        {!userId ? (
          <Stack gap={2} alignItems="center">
            <Typography>参加前にニックネームを入力してください。</Typography>
            <TextField
              label="ニックネーム"
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputProps={{ maxLength: 20 }}
              fullWidth
            />
            {joinError && <Alert severity="error">{joinError}</Alert>}
            <Button variant="contained" onClick={handleJoin} disabled={!name.trim()}>
              参加する
            </Button>
          </Stack>
        ) : (
          <>
            <Typography align="center">参加者: {name}</Typography>
            {question ? (
              <Stack gap={2}>
                {currentQuestionNumber && (
                  <Typography variant="subtitle1" color="text.secondary" align="left">
                    第 {currentQuestionNumber} 問
                  </Typography>
                )}
                <Typography variant="h5">{question.question}</Typography>
                {control?.isAnswerStarted && question.duration ? (
                  <Stack gap={1}>
                    <Typography color={isTimeUp ? "error" : "text.secondary"}>
                      残り時間: {timeLeft !== null ? `${Math.max(0, Math.ceil(timeLeft))} 秒` : `${question.duration} 秒`}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Stack>
                ) : (
                  <Typography color="text.secondary">選択肢が表示されるまでお待ちください。</Typography>
                )}
                {shouldShowChoices ? (
                  <>
                    <ToggleButtonGroup
                      exclusive
                      value={selectedChoice}
                      onChange={handleChoiceToggle}
                      orientation="vertical"
                      fullWidth
                    >
                      {question.choices.map((choice: any, index: number) => {
                        const responsesForChoice = counts[index] ?? 0;
                        return (
                          <ToggleButton
                            key={index}
                            value={index + 1}
                            disabled={submitted || isTimeUp || !control?.isAnswerStarted}
                            sx={(theme) => {
                              const isUserChoice = selectedChoice === index + 1;
                              const isCorrectChoice = correctChoiceIndex === index + 1;
                              const successBg = alpha(theme.palette.success.main, 0.18);
                              const errorBg = alpha(theme.palette.error.main, 0.18);
                              const baseSelectedBg = alpha(theme.palette.primary.main, 0.12);
                              const highlightStyles = showAnswerCheck
                                ? isCorrectChoice
                                  ? {
                                      backgroundColor: successBg,
                                      borderColor: theme.palette.success.main,
                                      color: theme.palette.success.dark || theme.palette.success.main,
                                    }
                                  : isUserChoice
                                    ? {
                                        backgroundColor: errorBg,
                                        borderColor: theme.palette.error.main,
                                        color: theme.palette.error.dark || theme.palette.error.main,
                                      }
                                    : {}
                                : {};
                              const animationValue =
                                showAnswerCheck && isUserChoice
                                  ? isCorrectChoice
                                    ? `${correctPulse} 0.9s ease-in-out 0s 2 alternate`
                                    : `${wrongShake} 0.7s ease-in-out`
                                  : undefined;
                              return {
                                textAlign: "center",
                                justifyContent: "center",
                                alignItems: "stretch",
                                gap: 1.2,
                                py: 2,
                                px: 1.5,
                                borderWidth: 2,
                                transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                                ...highlightStyles,
                                animation: animationValue,
                                transformOrigin: "center",
                                "&:hover": {
                                  transform: !showAnswerCheck ? "translateY(-2px)" : undefined,
                                  boxShadow: !showAnswerCheck ? theme.shadows[2] : undefined,
                                },
                                "&.Mui-selected": {
                                  backgroundColor: showAnswerCheck
                                    ? highlightStyles.backgroundColor || baseSelectedBg
                                    : baseSelectedBg,
                                  color: highlightStyles.color,
                                  borderColor: highlightStyles.borderColor,
                                },
                              };
                            }}
                          >
                            <Stack alignItems="center" gap={1.2} sx={{ width: "100%" }}>
                              <Typography variant="body1" fontWeight={600} textAlign="center">
                                {index + 1}. {choice.text}
                              </Typography>
                              {choice.imageUrl && (
                                <Box
                                  component="img"
                                  src={choice.imageUrl}
                                  alt={`choice-${index + 1}`}
                                  sx={{ maxHeight: 160, maxWidth: "100%", borderRadius: 2, objectFit: "contain" }}
                                />
                              )}
                              {control?.showAnswerCounts && counts.length > 0 && (
                                <Box
                                  sx={(theme) => ({
                                    alignSelf: "flex-end",
                                    borderRadius: "999px",
                                    border: `1px solid ${alpha(theme.palette.text.secondary, 0.4)}`,
                                    backgroundColor: alpha(theme.palette.background.paper, 0.75),
                                    px: 1.5,
                                    py: 0.4,
                                    display: "flex",
                                    alignItems: "center",
                                    color: theme.palette.text.secondary,
                                  })}
                                >
                                  <Typography variant="caption" fontWeight={600} color="text.primary">
                                    {responsesForChoice}人
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                    {control?.isAnswerStarted && isTimeUp && !submitted && (
                      <Alert severity="warning">回答時間が終了しました。次の問題をお待ちください。</Alert>
                    )}
                  </>
                ) : null}
                {showAnswerCheck && (
                  <Alert
                    severity={
                      selectedChoice == null
                        ? "info"
                        : isUserCorrect
                          ? "success"
                          : "error"
                    }
                  >
                    {selectedChoice == null
                      ? correctChoiceText
                        ? `回答が送信されていません。正解は「${correctChoiceText}」です。`
                        : "回答が送信されていません。"
                      : isUserCorrect
                        ? "正解です！その調子です。"
                        : correctChoiceText
                          ? `不正解です。正解は「${correctChoiceText}」でした。`
                          : "不正解です。"}
                  </Alert>
                )}
              </Stack>
            ) : (
              <Typography align="center">現在進行中の問題はありません。</Typography>
            )}

            {control?.showResult && rankedResults.length > 0 && (
              <Stack gap={2} mt={2}>
                <Typography variant="h6">結果発表</Typography>
                <Typography variant="caption" color="text.secondary">
                  {revealedCount < rankedResults.length
                    ? "下位から順に発表中…"
                    : "すべての順位が出揃いました！"}
                </Typography>
                <Stack gap={1.5}>
                  {rankedResults.map((res, index) => {
                    const rank = index + 1;
                    const isVisible = rankedResults.length - index <= revealedCount;
                    if (!isVisible) return null;
                    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                    return (
                      <Box
                        key={res.userId}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid rgba(15,23,42,0.08)",
                          backgroundColor: "rgba(255,255,255,0.9)",
                          px: 3,
                          py: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            第 {rank} 位 {medal && <Box component="span">{medal}</Box>}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {res.name}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                          {res.correctCount} 問正解
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Stack>
            )}
          </>
        )}
        </Stack>
      </Container>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 32 },
          zIndex: 1200,
          pointerEvents: "none",
        }}
      >
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          sx={{
            borderRadius: "999px",
            px: 3,
            py: 1.1,
            boxShadow: (theme) => theme.shadows[5],
            pointerEvents: "auto",
          }}
        >
          {submitButtonLabel}
        </Button>
      </Box>
      <Fade
        in={!!overlayMessage && isOverlayVisible}
        timeout={{ enter: 200, exit: 600 }}
        mountOnEnter
        unmountOnExit
        onExited={() => setOverlayMessage(null)}
      >
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(1px)",
          }}
        >
          <Box
            sx={{
              background: overlayMessage === "correct" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.95)",
              px: 4,
              py: 3,
              borderRadius: 3,
              boxShadow: (theme) => theme.shadows[6],
            }}
          >
            <Typography
              variant="h4"
              color={overlayMessage === "correct" ? "success.main" : "error.main"}
              fontWeight={700}
              textAlign="center"
            >
              {overlayMessage === "correct" ? "正解！" : "不正解…"}
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

function ParticipantFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "white",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6">読み込み中です…</Typography>
        <CircularProgress color="inherit" />
      </Stack>
    </Box>
  );
}

export default function Participant() {
  return (
    <Suspense fallback={<ParticipantFallback />}>
      <ParticipantContent />
    </Suspense>
  );
}
