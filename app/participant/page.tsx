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
} from 'firebase/firestore';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
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
      const qs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setQuestions(qs);
    });
    return () => unsubscribe();
  }, []);

  // 現在の質問を更新
  useEffect(() => {
    if (
      control &&
      Array.isArray(questions) &&
      control.currentQuestionIndex < questions.length
    ) {
      setQuestion(questions[control.currentQuestionIndex]);
    }
  }, [control, questions]);

  // 質問切り替えやモード切り替え時にローカル状態をリセット
  useEffect(() => {
    setSelectedChoice(null);
    setSubmitted(false);
    setCounts([]);
  }, [control?.currentQuestionIndex, control?.showAnswerCounts, control?.isAnswerStarted]);

  // 名前入力後に userId を生成
  const handleJoin = () => {
    const id = `${name}_${crypto.randomUUID().slice(0, 8)}`;
    setUserId(id);
  };

  // 回答を送信
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

  // 回答数を取得
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
          const data: any = d.data();
          const ch = data.choice;
          if (typeof ch === 'number') cnts[ch - 1] = (cnts[ch - 1] || 0) + 1;
        });
        setCounts(cnts);
      })();
    }
  }, [control?.showAnswerCounts, question]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
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
      ) : !control?.isQuizStarted ? (
        <Typography variant="h6">
          管理者がクイズを開始するまでお待ちください。
        </Typography>
      ) : control.isQuizStarted && !control.isAnswerStarted ? (
        <Box>
          <Typography variant="h6">{question?.question}</Typography>
        </Box>
      ) : control.isAnswerStarted && !control.showAnswerCounts && !control.showAnswerCheck ? (
        <Box>
          <Typography variant="h6">{question?.question}</Typography>
          {!submitted ? (
            <Box sx={{ mt: 2 }}>
              <RadioGroup
                value={
                  selectedChoice != null ? selectedChoice : ''
                }
                onChange={(e) => setSelectedChoice(Number(e.target.value))}
              >
                {question?.choices.map((c: any, idx: number) => (
                  <FormControlLabel
                    key={idx}
                    value={idx + 1}
                    control={<Radio />}
                    label={c.text || `選択肢${idx + 1}`}
                  />
                ))}
              </RadioGroup>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                disabled={selectedChoice == null}
                onClick={handleSubmit}
              >
                回答
              </Button>
            </Box>
          ) : (
            <Typography variant="body1">
              回答済みです。お待ちください。
            </Typography>
          )}
        </Box>
      ) : control.showAnswerCounts ? (
        <Box>
          <Typography variant="h6">回答数</Typography>
          {counts.map((count, idx) => (
            <Typography key={idx}>
              選択肢{idx + 1}: {count} 件
            </Typography>
          ))}
        </Box>
      ) : control.showAnswerCheck ? (
        <Box>
          <Typography variant="h6">{question?.question}</Typography>
          <Typography variant="h6" color="secondary">
            正解: 選択肢{question?.answer}
          </Typography>
        </Box>
      ) : null}
    </Container>
  );
};

export default Participant;
