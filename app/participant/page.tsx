'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

const Participant: React.FC = () => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [control, setControl] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [question, setQuestion] = useState<any>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [counts, setCounts] = useState<number[]>([]);
  const [results, setResults] = useState<
    { userId: string; name: string; correctCount: number }[]
  >([]);

  // 管理者画面の操作状況を購読
  useEffect(() => {
    const controlRef = doc(db, 'quizControl', 'control');
    const unsubscribe = onSnapshot(controlRef, (snap) => {
      if (snap.exists()) setControl(snap.data());
    });
    return () => unsubscribe();
  }, []);

  // 質問一覧を購読
  useEffect(() => {
    const q = query(
      collection(db, 'questions'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 現在の質問を更新
  useEffect(() => {
    if (
      control &&
      typeof control.currentQuestionIndex === 'number' &&
      control.currentQuestionIndex < questions.length
    ) {
      setQuestion(questions[control.currentQuestionIndex]);
    }
  }, [control, questions]);

  // フェーズ切替時リセット
  useEffect(() => {
    setSelectedChoice(null);
    setSubmitted(false);
    setCounts([]);
  }, [control?.currentQuestionIndex, control?.showAnswerCounts, control?.isAnswerStarted]);

  // 名前入力後に userId を生成
  const handleJoin = async () => {
    const id = `${name}_${crypto.randomUUID().slice(0, 8)}`;
    setUserId(id);
    // participants コレクションに保存
    await setDoc(doc(db, 'participants', id), { name });
  };

  // 回答選択切り替え
  const handleChoiceToggle = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    if (submitted) return;
    setSelectedChoice(newValue);
  };

  // 回答送信
  const handleSubmit = async () => {
    if (!question || selectedChoice == null) return;
    await addDoc(collection(db, 'answers'), {
      userId,
      questionId: question.id,
      choice: selectedChoice,
      timestamp: serverTimestamp(),
    });
    setSubmitted(true);
  };

  // 回答数取得
  useEffect(() => {
    if (control?.showAnswerCounts && question) {
      (async () => {
        const ansQ = query(
          collection(db, 'answers'),
          where('questionId', '==', question.id)
        );
        const snap = await getDocs(ansQ);
        const cnts = question.choices.map(() => 0);
        snap.docs.forEach((d) => {
          const ch = d.data().choice;
          if (typeof ch === 'number') cnts[ch - 1] += 1;
        });
        setCounts(cnts);
      })();
    }
  }, [control?.showAnswerCounts, question]);

  // --- (2) showResult フラグ検知時の集計処理 ---
  useEffect(() => {
    if (!control?.showResult) return;

    (async () => {
      // ① 全参加者を取得
      const partSnap = await getDocs(collection(db, 'participants'));
      const users = partSnap.docs.map(d => ({
        userId: d.id,
        name: d.data().name as string
      }));

      // ② 全回答を取得
      const ansSnap = await getDocs(collection(db, 'answers'));
      const answers = ansSnap.docs.map(d => ({
        userId: d.data().userId as string,
        questionId: d.data().questionId as string,
        choice: d.data().choice as number
      }));

      // ③ 問題の正解マップを作成
      const answerMap = Object.fromEntries(
        questions.map(q => [q.id, q.answer])
      );

      // ④ ユーザーごとに正解数をカウント
      const countMap: Record<string, number> = {};
      answers.forEach(a => {
        if (a.choice === answerMap[a.questionId]) {
          countMap[a.userId] = (countMap[a.userId] || 0) + 1;
        }
      });

      // ⑤ 結果配列を生成し、正解数でソート
      const ranked = users.map(u => ({
        ...u,
        correctCount: countMap[u.userId] || 0,
      }))
      .sort((a, b) => b.correctCount - a.correctCount);

      setResults(ranked);
    })();
  }, [control?.showResult, questions]);

    // --- レンダリングに結果画面を追加 ---
  if (control?.showResult) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          結果発表
        </Typography>
        {results.length === 0 ? (
          <CircularProgress />
        ) : (
          <Box component="ol" sx={{ pl: 2 }}>
            {results.map((r, idx) => (
              <Box component="li" key={r.userId} sx={{ mb: 1 }}>
                <Typography>
                  {idx + 1}位&nbsp;{r.name}&nbsp;—&nbsp;{r.correctCount}問正解
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    );
  }
  // レンダリング
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {/* 名前入力 */}
      {!userId ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            参加者画面
          </Typography>
          <TextField
            label="お名前"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!name.trim()}
            onClick={handleJoin}
          >
            参加
          </Button>
        </Box>
      ) : (
        <>
          {/* 問題文 */}
          <Typography variant="h6" gutterBottom>
            {question?.question}
          </Typography>

          {/* 選択肢カード */}
          {control?.isAnswerStarted && ( // 回答スタートまでは選択肢を表示させない。
          <ToggleButtonGroup
            exclusive
            value={selectedChoice}
            onChange={handleChoiceToggle}
            sx={{
              flexWrap: 'wrap',
              gap: 2,
              // 通常の ToggleButton にも角丸を付ける
              '& .MuiToggleButton-root': {
                borderRadius: 2,
              },
              // grouped（グループ化）による角丸リセットを防止
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: 2,
              },
            }}
          >
            {question?.choices.map((c: any, idx: number) => {
              const choiceNo = idx + 1;
              const isCorrect = control?.showAnswerCheck && choiceNo === question.answer;
              const count = control?.showAnswerCounts ? counts[idx] : null;
              return (
                <ToggleButton
                  key={idx}
                  value={choiceNo}
                  disabled={
                    !control?.isAnswerStarted ||
                    submitted ||
                    control?.showAnswerCounts ||
                    control?.showAnswerCheck
                  }
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    textTransform: 'none',
                    position: 'relative',
                    minHeight: 150,
                    minWidth: 200,
                    // 通常時のボーダー
                    border: isCorrect
                      ? '3px solid red'
                      : '1px solid transparent',
                    // disabled 状態でも赤枠をキープ
                    '&.Mui-disabled': {
                      border: isCorrect
                        ? '3px solid red'
                        : undefined,
                      // opacity を戻して見えやすく
                      opacity: 1,
                    },
                    // 選択時の影
                    '&.Mui-selected': {
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    {c.imageUrl && (
                      <Box
                        component="img"
                        src={c.imageUrl}
                        alt={c.text}
                        sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, mb: 1 }}
                      />
                    )}
                    <Typography variant="body1">{c.text}</Typography>
                  </Box>
                  {/* 回答数バッジ */}
                  {control?.showAnswerCounts && count != null && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="white">
                        {count}
                      </Typography>
                    </Box>
                  )}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
          )}

          {/* ボタン／メッセージ */}
          {!submitted && control?.isAnswerStarted && !control?.showAnswerCounts && !control?.showAnswerCheck ? (
            <Button
              variant="contained"
              sx={{ mt: 2 , justifyContent: 'center'}}
              disabled={selectedChoice == null}
              onClick={handleSubmit}
              
            >
              回答
            </Button>
          ) : null}

          {/* 回答済みメッセージ */}
          {submitted && !control?.showAnswerCounts && !control?.showAnswerCheck && (
            <Typography variant="body1" sx={{ mt: 2 }} alignItems="center">
              回答済みです。お待ちください。
            </Typography>
          )}

          {/* アンサーチェック結果 */}
          {control?.showAnswerCheck && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">
                {selectedChoice === question.answer ? '正解です！' : 'はずれです・・・'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                次の問題までしばらくお待ちください。
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Participant;
