"use client";
import React, { useEffect, useMemo, useState, useCallback, useContext } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { auth, db, storage } from "@/src/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  addDoc,
  where,
  deleteField,
} from "firebase/firestore";
import { getStorage, ref as strRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteObject } from "firebase/storage";

/** ======================== 型 ======================== */
export type Choice = {
  text: string;
  imageUrl?: string;
  file?: File;
  deleted?: boolean;
  deletedUrl?: string;
};

export type ReceiveQuestion = {
  id: string;
  duration: number;
  question: string;
  choices: Choice[];
  timestamp: Timestamp;
  createdAt: Timestamp;
  answer: number;
  ownerId: string;
  quizId: string;
};

type ControlState = {
  isQuizStarted?: boolean;
  isAnswerStarted?: boolean;
  showAnswerCounts?: boolean;
  showAnswerCheck?: boolean;
  showResult?: boolean;
  currentQuestionIndex?: number;
  /** 回答開始時刻（進行状況の可視化用） */
  answerStartAt?: Timestamp;
};

/** ======================== 共通: Firestore購読 ======================== */
function useControl(ownerId: string | null) {
  const [control, setControl] = useState<ControlState>({});
  useEffect(() => {
    if (!ownerId) return;
    const ctrlRef = doc(db, "quizControl", ownerId);
    const unsub = onSnapshot(ctrlRef, (snap) => {
      if (snap.exists()) setControl(snap.data() as ControlState);
      else setControl({});
    });
    return () => unsub();
  }, [ownerId]);
  return control;
}

/** ======================== Questions Context（1回購読して全タブで共有） ======================== */
type QuestionsCtx = {
  questions: ReceiveQuestion[];
  /** 手動再読込も提供（基本はonSnapshotで自動更新） */
  reload: () => Promise<void>;
};
const QuestionsContext = React.createContext<QuestionsCtx | null>(null);

function useQuestionsCtx() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error("useQuestionsCtx must be used within QuestionsProvider");
  return ctx;
}

function QuestionsProvider({ ownerId, children }: { ownerId: string; children: React.ReactNode }) {
  const [questions, setQuestions] = useState<ReceiveQuestion[]>([]);

  // 初回にonSnapshotで購読 → 以降はリアルタイム更新。タブ切替では再購読しない。
  useEffect(() => {
    if (!ownerId) return;
    const qRef = query(
      collection(db, "questions"),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(qRef, (snap) => {
      setQuestions(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReceiveQuestion, "id">) }))
      );
    });
    return () => unsub();
  }, [ownerId]);

  const reload = useCallback(async () => {
    const qRef = query(
      collection(db, "questions"),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(qRef);
    setQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReceiveQuestion, "id">) })));
  }, [ownerId]);

  return (
    <QuestionsContext.Provider value={{ questions, reload }}>
      {children}
    </QuestionsContext.Provider>
  );
}

/** ======================== 1) 進行コントロール ======================== */
function ControlPanel({ ownerId }: { ownerId: string }) {
  const control = useControl(ownerId);
  const { questions } = useQuestionsCtx();
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const setCtrl = async (patch: Partial<ControlState>) => {
    const ctrlRef = doc(db, "quizControl", ownerId);
    await setDoc(ctrlRef, patch, { merge: true });
  };

  const handleReset = async () => {
    setIsResetting(true);
    await setCtrl({
      isQuizStarted: false,
      isAnswerStarted: false,
      showAnswerCounts: false,
      showAnswerCheck: false,
      showResult: false,
      currentQuestionIndex: 0,
      answerStartAt: deleteField() as any,
    });
    setIsResetting(false);
  };

  const handleClearAnswers = async () => {
    setIsClearing(true);
    const ansQ = query(collection(db, "answers"), where("quizId", "==", ownerId));
    const snap = await getDocs(ansQ);
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "answers", d.id))));
    setIsClearing(false);
  };

  const currentIndex = control.currentQuestionIndex ?? 0;
  const currentQuestion = questions[currentIndex];

  return (
    <Stack gap={2}>
      <Typography variant="h5">🕹️ クイズ進行</Typography>
      <Stack direction={{ xs: "column", md: "row" }} gap={1} flexWrap="wrap">
        <Button
          variant="contained"
          onClick={() => setCtrl({ isQuizStarted: true })}
          disabled={!!control.isQuizStarted}
        >クイズ開始</Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setCtrl({ isAnswerStarted: true, answerStartAt: serverTimestamp() })}
          disabled={!control.isQuizStarted || !!control.isAnswerStarted}
        >回答スタート</Button>
        <Button
          variant="contained"
          onClick={() => setCtrl({ showAnswerCounts: true })}
          disabled={!control.isAnswerStarted || !!control.showAnswerCounts}
        >回答数表示</Button>
        <Button
          variant="contained"
          onClick={() => setCtrl({ showAnswerCheck: true })}
          disabled={!control.isAnswerStarted || !!control.showAnswerCheck}
        >アンサーチェック</Button>
        <Button
          variant="contained"
          onClick={() => {
            const nextIndex = (control.currentQuestionIndex ?? 0) + 1;
            void setCtrl({ currentQuestionIndex: nextIndex, isAnswerStarted: false, showAnswerCounts: false, showAnswerCheck: false, answerStartAt: deleteField() as any });
          }}
          disabled={!control.isQuizStarted}
        >次の問題へ</Button>
        <Button
          variant="contained"
          onClick={() => setCtrl({ showResult: true, isAnswerStarted: false, showAnswerCounts: false, showAnswerCheck: false, answerStartAt: deleteField() as any })}
          disabled={!control.isQuizStarted || !!control.showResult}
        >結果発表</Button>
        <Button variant="outlined" onClick={handleReset} disabled={isResetting}>
          {isResetting ? "リセット中..." : "問題をリセット"}
        </Button>
        <Button variant="outlined" color="error" onClick={handleClearAnswers} disabled={isClearing}>
          {isClearing ? "クリア中..." : "全ての回答をクリア"}
        </Button>
      </Stack>
      <Divider />
      <CurrentStatusCard ownerId={ownerId} control={control} question={currentQuestion} index={currentIndex} />
    </Stack>
  );
}

/** ======================== 2) 作成フォーム ======================== */
const MAX_QUESTIONS = 10;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_DIMENSION = 1280;

async function readFileAsDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = dataUrl;
  });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("画像の変換に失敗しました"));
    reader.readAsDataURL(blob);
  });
}

async function compressImageFile(file: File): Promise<{ file: File; dataUrl: string }> {
  try {
    const originalDataUrl = await readFileAsDataURL(file);
    const image = await loadImage(originalDataUrl);
    const largestSide = Math.max(image.width, image.height);
    const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;

    if (scale === 1 && file.size <= MAX_IMAGE_SIZE_BYTES) {
      return { file, dataUrl: originalDataUrl };
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { file, dataUrl: originalDataUrl };
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const mimeType = file.type?.startsWith("image/") ? file.type : "image/jpeg";
    const quality = mimeType === "image/png" ? undefined : 0.85;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("画像の圧縮に失敗しました"));
      }, mimeType, quality);
    });

    const compressedFile = new File([blob], file.name, { type: blob.type, lastModified: file.lastModified });
    const dataUrl = await blobToDataURL(blob);
    return { file: compressedFile, dataUrl };
  } catch (error) {
    console.error(error);
    return { file, dataUrl: await readFileAsDataURL(file) };
  }
}

function CreateForm({ ownerId }: { ownerId: string }) {
  const { questions } = useQuestionsCtx();
  const [question, setQuestion] = useState("");
  const [choiceCount, setChoiceCount] = useState(4);
  const [choices, setChoices] = useState<Choice[]>([
    { text: "", imageUrl: "" },
    { text: "", imageUrl: "" },
    { text: "", imageUrl: "" },
    { text: "", imageUrl: "" },
  ]);
  const [duration, setDuration] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setChoices((prev) => {
      const next = [...prev];
      next.length = choiceCount;
      for (let i = 0; i < choiceCount; i++) if (!next[i]) next[i] = { text: "", imageUrl: "" };
      return next;
    });
  }, [choiceCount]);

  const isLimitReached = questions.length >= MAX_QUESTIONS;

  const isFormIncomplete = useMemo(
    () =>
      question.trim() === "" ||
      choices.slice(0, choiceCount).some((c) => (c.text?.trim?.() ?? "") === "" && !c.file) ||
      !duration || isNaN(duration) || selectedAnswer === null ||
      isLimitReached,
    [question, choices, choiceCount, duration, selectedAnswer, isLimitReached]
  );

  const addQuestion = async () => {
    if (isLimitReached) {
      alert(`登録できる問題は最大${MAX_QUESTIONS}問です。不要な問題を削除してから追加してください。`);
      return;
    }
    if (isFormIncomplete) return;
    setIsSubmitting(true);
    try {
      const uploadedChoices = await Promise.all(
        choices.slice(0, choiceCount).map(async (c) => {
          let imageUrl = c.imageUrl || "";
          if (c.file) {
            const id = crypto.randomUUID();
            const storageRef = strRef(storage, `choices/${id}_${c.file.name}`);
            await uploadBytes(storageRef, c.file);
            imageUrl = await getDownloadURL(storageRef);
          }
          return { text: c.text, imageUrl };
        })
      );

      await addDoc(collection(db, "questions"), {
        question,
        choices: uploadedChoices,
        duration,
        answer: selectedAnswer,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        ownerId,
        quizId: ownerId,
      });
      if (questions.length === MAX_QUESTIONS - 1) {
        alert(`登録できる問題数（${MAX_QUESTIONS}問）に達しました。`);
      }

      setQuestion("");
      setChoices([
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" },
      ]);
      setDuration(10);
      setSelectedAnswer(null);
      // onSnapshotで一覧は自動更新されるため、明示的なreloadは不要
    } catch (e) {
      console.error(e);
      alert("問題の追加に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap={3}>
      <Typography variant="h5">✍️ 問題を作成</Typography>
      {isLimitReached && (
        <Alert severity="info">
          登録できる問題は最大{MAX_QUESTIONS}問です。不要な問題を削除すると新しい問題を追加できます。
        </Alert>
      )}

      <TextField
        label="問題文"
        multiline
        fullWidth
        rows={4}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
        <Typography variant="subtitle2" color="text.secondary">選択肢の数</Typography>
        <ToggleButtonGroup
          value={choiceCount}
          exclusive
          onChange={(_, value) => {
            if (value === null) return;
            if (typeof value === "number") {
              setChoiceCount(value);
              setSelectedAnswer((prev) => (prev && prev > value ? null : prev));
            }
          }}
          size="small"
          sx={{
            backgroundColor: "background.paper",
            boxShadow: (theme) => theme.shadows[1],
          }}
        >
          {[2, 4].map((count) => (
            <ToggleButton
              key={count}
              value={count}
              sx={{ border: "none", px: 2.5, py: 0.5, fontWeight: 600 }}
            >
              {count}つ
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" gap={2} flexWrap="wrap">
        {choices.slice(0, choiceCount).map((choice, idx) => (
          <Box key={idx} sx={{ display: "flex", flexDirection: "column" }}>
            <TextField
              sx={{ mb: 0.5, minWidth: 220, maxWidth: 300 }}
              label={`選択肢 ${idx + 1}`}
              value={choice.text}
              onChange={(e) => {
                const updated = [...choices];
                updated[idx].text = e.target.value;
                setChoices(updated);
              }}
            />
            {!choice.file && !choice.imageUrl ? (
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ mt: 0, alignSelf: "flex-start", py: 0.5, px: 1.5 }}
              >
                + 画像
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { file: compressed, dataUrl } = await compressImageFile(file);
                    if (compressed.size > MAX_IMAGE_SIZE_BYTES) {
                      alert(`画像サイズは ${(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(1)}MB 以下にしてください。`);
                      return;
                    }
                    const updated = [...choices];
                    updated[idx].file = compressed;
                    updated[idx].imageUrl = dataUrl;
                    setChoices(updated);
                    e.target.value = "";
                  }}
                />
              </Button>
            ) : (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="green">{choice.file?.name ?? "画像選択済み"}</Typography>
                <Button size="small" onClick={() => {
                  const updated = [...choices];
                  updated[idx].file = undefined;
                  updated[idx].imageUrl = undefined;
                  setChoices(updated);
                }}>×</Button>
              </Box>
            )}
          </Box>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
        <Typography variant="subtitle2" color="text.secondary">答え</Typography>
        <ToggleButtonGroup
          value={selectedAnswer}
          exclusive
          onChange={(_, value) => {
            if (value === null) { setSelectedAnswer(null); return; }
            if (typeof value === "number") setSelectedAnswer(value);
          }}
          size="small"
          sx={{
            backgroundColor: "background.paper",
            boxShadow: (theme) => theme.shadows[1],
          }}
        >
          {choices.slice(0, choiceCount).map((_, idx) => (
            <ToggleButton
              key={idx}
              value={idx + 1}
              sx={{ border: "none", px: 1.75, py: 0.5, fontWeight: 600 }}
            >
              {idx + 1}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <TextField
        label="制限時間（秒）"
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        sx={{ maxWidth: 240 }}
      />

      <Box display="flex" alignItems="center" gap={2}>
        <Button variant="contained" disabled={isFormIncomplete || isSubmitting} onClick={addQuestion}>
          {isSubmitting ? "アップロード中..." : "問題追加"}
        </Button>
        {isSubmitting && <CircularProgress size={22} />}
      </Box>
    </Stack>
  );
}

/** ======================== 3) 一覧＆編集 ======================== */
function QuestionsTable({ ownerId }: { ownerId: string }) {
  const { questions } = useQuestionsCtx();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestionData, setEditQuestionData] = useState<ReceiveQuestion | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleEditClick = (q: ReceiveQuestion) => {
    setEditingId(q.id);
    setEditQuestionData({ ...q });
  };

  const handleSaveClick = async () => {
    if (!editQuestionData) return;
    if (editQuestionData.ownerId !== ownerId) {
      alert("この問題を編集する権限がありません。");
      return;
    }
    setIsEditSubmitting(true);
    try {
      const uploadedChoices = await Promise.all(
        editQuestionData.choices.map(async (c) => {
          if (c.deletedUrl) {
            try {
              const decodedPath = decodeURIComponent(new URL(c.deletedUrl).pathname.split("/o/")[1]);
              const imageRef = strRef(storage, decodedPath);
              await deleteObject(imageRef);
            } catch (err) {
              console.warn("削除失敗", err);
            }
          }
          let imageUrl = c.imageUrl || "";
          if (c.file) {
            const id = crypto.randomUUID();
            const storageRef = strRef(storage, `choices/${id}_${c.file.name}`);
            await uploadBytes(storageRef, c.file);
            imageUrl = await getDownloadURL(storageRef);
          }
          return { text: c.text, imageUrl };
        })
      );

      const refDoc = doc(db, "questions", editQuestionData.id);
      await setDoc(refDoc, { ...editQuestionData, choices: uploadedChoices, timestamp: serverTimestamp() });

      setEditingId(null);
      // 一覧はonSnapshotで自動更新
    } catch (err) {
      console.error("編集保存エラー:", err);
      alert("保存に失敗しました");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      const docRef = doc(db, "questions", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ReceiveQuestion;
        if (data.ownerId !== ownerId) {
          alert("この問題を削除する権限がありません。");
          return;
        }
        for (const choice of data.choices) {
          if (typeof choice === "object" && choice.imageUrl) {
            try {
              const storage = getStorage();
              const decodedPath = decodeURIComponent(new URL(choice.imageUrl).pathname.split("/o/")[1]);
              const imageRef = strRef(storage, decodedPath);
              await deleteObject(imageRef);
            } catch (err) {
              console.warn("画像削除に失敗:", err);
            }
          }
        }
      }
      await deleteDoc(docRef);
      // onSnapshotが反映してくれる
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  return (
    <Stack gap={2}>
      <Typography variant="h5">📋 問題一覧</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 62 }}>番号</TableCell>
              <TableCell sx={{ minWidth: 220 }}>問題</TableCell>
              <TableCell sx={{ minWidth: 180 }}>選択肢1</TableCell>
              <TableCell sx={{ minWidth: 180 }}>選択肢2</TableCell>
              <TableCell sx={{ minWidth: 180 }}>選択肢3</TableCell>
              <TableCell sx={{ minWidth: 180 }}>選択肢4</TableCell>
              <TableCell sx={{ minWidth: 62 }}>答え</TableCell>
              <TableCell sx={{ minWidth: 62 }}>時間</TableCell>
              <TableCell sx={{ minWidth: 120 }} align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((q, index) => (
              <TableRow key={q.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ verticalAlign: "center" }}>
                  {editingId === q.id ? (
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={6}
                      value={editQuestionData?.question || ""}
                      onChange={(e) => setEditQuestionData((prev) => (prev ? { ...prev, question: e.target.value } : null))}
                    />
                  ) : (
                    q.question
                  )}
                </TableCell>
                {[0, 1, 2, 3].map((i) => (
                  <TableCell key={i} sx={{ verticalAlign: "center" }}>
                    {editingId === q.id ? (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          maxRows={5}
                          value={editQuestionData?.choices[i]?.text || ""}
                          onChange={(e) => {
                            if (!editQuestionData) return;
                            const updatedChoices = [...editQuestionData.choices];
                            updatedChoices[i] = { ...updatedChoices[i], text: e.target.value };
                            setEditQuestionData({ ...editQuestionData, choices: updatedChoices });
                          }}
                        />
                        {editQuestionData?.choices[i]?.imageUrl && !editQuestionData?.choices[i]?.deleted && (
                          <Box mt={1} display="flex" alignItems="center" gap={1}>
                            <Box
                              component="img"
                              src={editQuestionData.choices[i].imageUrl}
                              alt={`選択肢${i + 1}`}
                              sx={{ maxHeight: 60, borderRadius: 1, cursor: "pointer" }}
                              onClick={() => setPreviewImage(editQuestionData.choices[i].imageUrl)}
                            />
                            <Button size="small" onClick={() => {
                              if (!editQuestionData) return;
                              const updatedChoices = [...editQuestionData.choices];
                              updatedChoices[i] = {
                                ...updatedChoices[i],
                                deletedUrl: updatedChoices[i].imageUrl,
                                imageUrl: "",
                                deleted: false,
                              };
                              setEditQuestionData({ ...editQuestionData, choices: updatedChoices });
                            }}>×</Button>
                          </Box>
                        )}
                        {!editQuestionData?.choices[i]?.imageUrl || editQuestionData?.choices[i]?.deleted ? (
                          <Button variant="outlined" component="label" size="small" sx={{ mt: 1 }}>
                            + 画像
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !editQuestionData) return;
                                const { file: compressed, dataUrl } = await compressImageFile(file);
                                if (compressed.size > MAX_IMAGE_SIZE_BYTES) {
                                  alert(`画像サイズは ${(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(1)}MB 以下にしてください。`);
                                  return;
                                }
                                const updatedChoices = [...editQuestionData.choices];
                                updatedChoices[i] = { ...updatedChoices[i], imageUrl: dataUrl, file: compressed, deleted: false };
                                setEditQuestionData({ ...editQuestionData, choices: updatedChoices });
                                e.target.value = "";
                              }}
                            />
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {q.choices[i]?.text ?? ""}
                        {q.choices[i]?.imageUrl && (
                          <Box
                            component="img"
                            src={q.choices[i].imageUrl}
                            alt={`選択肢${i + 1}`}
                            sx={{ display: "block", maxHeight: 60, mt: 0.5, borderRadius: 1, cursor: "pointer" }}
                            onClick={() => setPreviewImage(q.choices[i]?.imageUrl ?? null)}
                          />
                        )}
                      </>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {editingId === q.id ? (
                    <TextField type="number" value={editQuestionData?.answer ?? ""} onChange={(e) => setEditQuestionData((prev) => (prev ? { ...prev, answer: Number(e.target.value) } : null))} />
                  ) : (
                    q.answer
                  )}
                </TableCell>
                <TableCell>
                  {editingId === q.id ? (
                    <TextField type="number" value={editQuestionData?.duration ?? ""} onChange={(e) => setEditQuestionData((prev) => (prev ? { ...prev, duration: Number(e.target.value) } : null))} />
                  ) : (
                    q.duration
                  )}
                </TableCell>
                <TableCell>
                  <Stack alignItems="center" gap={1}>
                    {editingId === q.id ? (
                      <>
                        <Button size="small" onClick={handleSaveClick} disabled={isEditSubmitting}>
                          {isEditSubmitting ? "保存中..." : "保存"}
                        </Button>
                        <Button size="small" onClick={() => setEditingId(null)} disabled={isEditSubmitting}>キャンセル</Button>
                      </>
                    ) : (
                      <>
                        <Button size="small" onClick={() => handleEditClick(q)}>編集</Button>
                        <Button size="small" color="error" onClick={() => deleteQuestion(q.id)}>削除</Button>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="lg">
        <DialogContent sx={{ p: 2 }}>
          <Box
            component="img"
            src={previewImage ?? undefined}
            alt="画像プレビュー"
            sx={{ maxWidth: { xs: "80vw", md: "70vw" }, maxHeight: { xs: "70vh", md: "80vh" }, display: "block" }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

/** ======================== ルート: タブで分割（アンマウントさせずに表示切替） ======================== */
function a11yProps(index: number) {
  return { id: `host-tab-${index}`, "aria-controls": `host-tabpanel-${index}` };
}
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  // childrenは常にマウントしたまま、表示だけ切り替える → タブ切替で再読込しない
  return (
    <Box
      role="tabpanel"
      id={`host-tabpanel-${index}`}
      aria-labelledby={`host-tab-${index}`}
      sx={{ pt: 3, display: value === index ? "block" : "none" }}
    >
      {children}
    </Box>
  );
}

export default function HostScreen() {
  const [tab, setTab] = useState(0);
  const { user, loading, logout, requestEmailVerification, refreshUser } = useAuth();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ownerId = user?.uid ?? "";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/participant?quiz=${ownerId}` : "";
  const [quizTitle, setQuizTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);
  useEffect(() => {
    if (user?.emailVerified) {
      setInfoMessage(null);
      setErrorMessage(null);
    }
  }, [user?.emailVerified]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error(error);
    }
  }, [logout, router]);

  useEffect(() => {
    if (!ownerId) {
      setQuizTitle("");
      return;
    }
    const quizRef = doc(db, "quizzes", ownerId);
    const unsub = onSnapshot(quizRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { title?: string };
        setQuizTitle(data.title ?? "");
      } else {
        setQuizTitle("");
      }
    });
    return () => unsub();
  }, [ownerId]);

  const handleSaveTitle = useCallback(async () => {
    if (!ownerId) return;
    setIsSavingTitle(true);
    try {
      const normalized = quizTitle.replace(/\s+/g, "");
      const value = normalized ? quizTitle : "クイズ大会";
      await setDoc(
        doc(db, "quizzes", ownerId),
        { title: value, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setInfoMessage("クイズ名を保存しました。");
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("クイズ名の保存に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setIsSavingTitle(false);
    }
  }, [ownerId, quizTitle]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setErrorMessage("お使いのブラウザではコピー機能が利用できません。リンクを手動で選択してください。");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setInfoMessage("共有リンクをコピーしました。参加者に共有してください。");
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("共有リンクのコピーに失敗しました。");
    }
  }, [shareUrl]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user.emailVerified) {
    const handleResendVerification = async () => {
      setErrorMessage(null);
      setInfoMessage(null);
      setResending(true);
      try {
        await requestEmailVerification();
        setInfoMessage("確認メールを再送しました。届かない場合は迷惑メールフォルダもご確認ください。");
      } catch (err) {
        console.error(err);
        setErrorMessage("確認メールの再送に失敗しました。時間を置いて再度お試しください。");
      } finally {
        setResending(false);
      }
    };

    const handleRefreshStatus = async () => {
      setErrorMessage(null);
      setInfoMessage(null);
      setRefreshing(true);
      try {
        await refreshUser();
        if (auth.currentUser?.emailVerified) {
          setInfoMessage("メールアドレスが確認されました。画面を再読み込みします。");
        } else {
          setInfoMessage("まだ確認が完了していません。メール内のリンクを開いた後に再度更新してください。");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("確認状態の更新に失敗しました。時間を置いて再度お試しください。");
      } finally {
        setRefreshing(false);
      }
    };

    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Stack gap={3}>
          <Typography variant="h5">メールアドレスの確認が必要です</Typography>
          <Alert severity="info">
            {user.email ?? "未設定"} に送信されたメール内のリンクを開いてアドレスを確認してください。
          </Alert>
          {infoMessage && <Alert severity="success">{infoMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <Button
              variant="contained"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? "再送信中..." : "確認メールを再送"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleRefreshStatus}
              disabled={refreshing}
            >
              {refreshing ? "確認中..." : "確認状態を再読み込み"}
            </Button>
            <Button variant="text" onClick={handleLogout}>
              ログアウト
            </Button>
          </Stack>
        </Stack>
      </Container>
    );
  }

  return (
    <QuestionsProvider ownerId={ownerId}>
      <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
        <Stack gap={2} mb={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Typography variant="h4" color="primary">
              出題者画面
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                ログイン中: {user.email ?? "未設定"}
              </Typography>
              <Button variant="outlined" onClick={handleLogout}>
                ログアウト
              </Button>
            </Stack>
          </Stack>
          {(infoMessage || errorMessage) && (
            <Stack gap={1}>
              {infoMessage && <Alert severity="success">{infoMessage}</Alert>}
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            </Stack>
          )}
          <Stack direction={{ xs: "column", md: "row" }} gap={1} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              label="クイズ大会名"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              placeholder="クイズ大会名を入力"
            />
            <Button
              variant="outlined"
              onClick={handleSaveTitle}
              disabled={isSavingTitle || !ownerId}
              sx={{ minWidth: { md: 160 } }}
            >
              {isSavingTitle ? "保存中..." : "クイズ名を保存"}
            </Button>
          </Stack>
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={1}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              label="参加者用リンク"
              value={shareUrl}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleCopyShareLink}
              disabled={!ownerId}
              sx={{ alignSelf: { xs: "flex-end", md: "center" }, minWidth: { md: 160 } }}
            >
              リンクをコピー
            </Button>
          </Stack>
        </Stack>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
        >
          <Tab label="進行" {...a11yProps(0)} />
          <Tab label="作成" {...a11yProps(1)} />
          <Tab label="一覧・編集" {...a11yProps(2)} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <ControlPanel ownerId={ownerId} />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <CreateForm ownerId={ownerId} />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <QuestionsTable ownerId={ownerId} />
        </TabPanel>
      </Container>
    </QuestionsProvider>
  );
}

/** ======================== 進行状況カード ======================== */
function useAnswerCounts(ownerId: string, question?: ReceiveQuestion) {
  const [counts, setCounts] = useState<number[]>([]);
  useEffect(() => {
    if (!question) { setCounts([]); return; }
    const size = Math.min(4, question.choices.filter(Boolean).length || 4);
    const col = collection(db, 'answers');
    const qByQuestion = query(
      col,
      where('quizId', '==', ownerId),
      where('questionId', '==', question.id)
    );
    const unsub = onSnapshot(qByQuestion, (snap) => {
      const arr = new Array(size).fill(0);
      snap.forEach((d) => {
        const ch = (d.data() as any).choice; // 1-based想定
        if (typeof ch === 'number' && ch >= 1 && ch <= size) arr[ch - 1]++;
      });
      setCounts(arr);
    });
    return () => unsub();
  }, [ownerId, question?.id, question?.choices]);
  return counts;
}

function CurrentStatusCard({
  ownerId,
  control,
  question,
  index,
}: {
  ownerId: string;
  control: ControlState;
  question?: ReceiveQuestion;
  index: number;
}) {
  const counts = useAnswerCounts(ownerId, question);
  const phase = control.showResult
    ? '結果発表'
    : control.showAnswerCheck
      ? 'アンサーチェック'
      : control.showAnswerCounts
        ? '回答数表示'
        : control.isAnswerStarted
          ? '回答中'
          : control.isQuizStarted
            ? '待機中'
            : '未開始';

  const duration = question?.duration ?? 0;
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!control.isAnswerStarted || !control.answerStartAt || !duration) return;
    const t = setInterval(() => setNow(new Date()), 500);
    return () => clearInterval(t);
  }, [control.isAnswerStarted, control.answerStartAt?.seconds, duration]);

  let progress = 0;
  if (control.isAnswerStarted && control.answerStartAt && duration) {
    const started = control.answerStartAt.toDate().getTime();
    const elapsed = (now.getTime() - started) / 1000;
    progress = Math.max(0, Math.min(100, (elapsed / duration) * 100));
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack gap={1}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip label={`フェーズ: ${phase}`} color="primary" variant="outlined" />
            <Chip label={`現在の問題: ${index + 1}`} variant="outlined" />
            {question && <Chip label={`制限: ${question.duration}s`} variant="outlined" />}
          </Stack>

          {control.isAnswerStarted && !!duration && (
            <Box>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption">{Math.floor((progress/100)*duration)}s / {duration}s</Typography>
            </Box>
          )}

          <Divider />

          {question ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>現在表示中の問題</Typography>
              <Typography sx={{ mb: 1 }}>{question.question}</Typography>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {question.choices.slice(0, 4).map((c, i) => (
                  <Box key={i} sx={{ minWidth: 220 }}>
                    <Typography variant="body2">{`選択肢 ${i + 1}`}</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{c?.text ?? ''}</Typography>
                    {typeof counts[i] === 'number' && (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <LinearProgress variant="determinate" value={counts.length ? (counts[i] / Math.max(1, counts.reduce((a,b)=>a+b,0))) * 100 : 0} sx={{ flex: 1 }} />
                        <Typography variant="caption">{counts[i] ?? 0}</Typography>
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary">問題が見つかりません（インデックス {index + 1}）。</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
