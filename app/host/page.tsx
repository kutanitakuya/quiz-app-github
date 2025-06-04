'use client';
import React, { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, deleteDoc, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import Grid from '@mui/material/Grid'
import './page.css';

type ReceiveQuestion = {
  id: string;
  question: string;
  choices: string[];
  order: number;
  answer: number;
};

const Host: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [duration, setDuration] = useState(10); // 秒数
  const [answer, setAnswer] = useState("");
  const [choiceCount, setChoiceCount] = useState(4); // ← 2 または 4 を選べる
  const [receiveQuestions, setReceiveQuestions] = useState<ReceiveQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // 編集中の問題のID
  const [editQuestionData, setEditQuestionData] = useState<ReceiveQuestion | null>(null); 

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  // フォームが未入力かどうかをチェック
  // 問題文, 選択肢, 制限時間 のいずれかが空の場合は true を返し、問題送信ボタンを押せないようにする。
  const isFormIncomplete =
  question.trim() === "" ||
  choices.some((choice) => choice.trim() === "") ||
  !duration || isNaN(duration);

  // Firestore から問題を取得して表示する
  useEffect(() => {
    const fetchQuestions = async () => {
      const q = query(collection(db, "questions"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReceiveQuestion, "id">),
      }));
      setReceiveQuestions(list);
    };

    fetchQuestions();
  }, []);

  // 選択肢の数が変更されたときに choices の配列を更新
  // 2つまたは4つの選択肢を持つようにする。
  useEffect(() => {
    setChoices((prevChoices) => {
      const newChoices = [...prevChoices];
      newChoices.length = choiceCount;
      for (let i = 0; i < choiceCount; i++) {
        if (newChoices[i] === undefined) newChoices[i] = "";
      }
      return newChoices;
    });
  }, [choiceCount]);

  // 問題を Firestore に追加する関数
  const addQuestion = async () => {
    const questionsRef = collection(db, "questions");

    // 新しい問題を Firestore に送信
    await addDoc(questionsRef, {
      question,
      choices: choices.slice(0, choiceCount),
      duration,
      answer: selectedAnswer,
      timestamp: serverTimestamp(),
    });

    alert("問題を送信しました！");
  };

  // 問題を送信する関数
  // これは、現在の問題を更新し、前の回答をクリアする。
  const handleSubmit = async () => {
    const currentQuestionRef = doc(db, "quiz", "currentQuestion");

    // 前の回答をクリア（subcollectionの answers を削除）
    const answersRef = collection(currentQuestionRef, "answers");
    const snapshot = await getDocs(answersRef);
    snapshot.forEach(docSnap => deleteDoc(docSnap.ref));

    // 新しい問題を Firestore に送信
    await setDoc(currentQuestionRef, {
      question,
      choices,
      duration,
      answer,
      timestamp: serverTimestamp(),
    });

    alert("問題を送信しました！");
    // 入力された値をクリアする。
    setQuestion("");
    setChoices(["", "", "", ""]);
    setDuration(10);
  };

  // 問題編集
  const handleEditClick = (question: ReceiveQuestion) => {
    setEditingId(question.id);
    setEditQuestionData({ ...question });
  };

  // 問題編集
  const handleSaveClick = async () => {
    if (!editQuestionData) return;
    const ref = doc(db, "questions", editQuestionData.id);
    await setDoc(ref, {
      question: editQuestionData.question,
      choices: editQuestionData.choices,
      order: editQuestionData.order,
      answer: editQuestionData.answer,
      timestamp: serverTimestamp(),
    });
    alert("更新しました！");
    setEditingId(null);
    // 最新の一覧を取得
    const snapshot = await getDocs(query(collection(db, "questions"), orderBy("order", "asc")));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReceiveQuestion, "id">),
    }));
    setReceiveQuestions(list);
  };


  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom>出題者画面</Typography>

      <Box mb={3}>
        <TextField
          label="問題文"
          multiline
          fullWidth
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Box>

      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">選択肢の数</FormLabel>
        <RadioGroup row value={choiceCount} onChange={(e) => setChoiceCount(Number(e.target.value))}>
          <FormControlLabel value={2} control={<Radio />} label="2つ" />
          <FormControlLabel value={4} control={<Radio />} label="4つ" />
        </RadioGroup>
      </FormControl>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {choices.slice(0, choiceCount).map((choice, idx) => (
          <Grid item xs={12} key={idx}>
            <TextField
              fullWidth
              label={`選択肢 ${idx + 1}`}
              value={choice}
              onChange={(e) => handleChoiceChange(idx, e.target.value)}
            />
          </Grid>
        ))}
      </Grid>

      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">答え</FormLabel>
        <RadioGroup
          value={selectedAnswer ?? ""}
          onChange={(e) => setSelectedAnswer(Number(e.target.value))}
        >
          {choices.slice(0, choiceCount).map((_, idx) => (
            <FormControlLabel
              key={idx}
              value={idx + 1}
              control={<Radio />}
              label={`選択肢 ${idx + 1}`}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Box mb={3}>
        <TextField
          label="制限時間（秒）"
          type="number"
          fullWidth
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <Button variant="contained" color="primary" disabled={isFormIncomplete} onClick={addQuestion}>
          問題追加
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleSubmit}>
          回答受付
        </Button>
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>問題一覧</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>番号</TableCell>
                <TableCell>問題</TableCell>
                <TableCell>選択肢1</TableCell>
                <TableCell>選択肢2</TableCell>
                <TableCell>選択肢3</TableCell>
                <TableCell>選択肢4</TableCell>
                <TableCell>答え</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receiveQuestions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.order}</TableCell>
                  <TableCell>
                    {editingId === q.id ? (
                      <TextField
                        value={editQuestionData?.question || ""}
                        onChange={(e) =>
                          setEditQuestionData((prev) => prev ? { ...prev, question: e.target.value } : null)
                        }
                      />
                    ) : (
                      q.question
                    )}
                  </TableCell>
                  {[0, 1, 2, 3].map((i) => (
                    <TableCell key={i}>
                      {editingId === q.id ? (
                        <TextField
                          value={editQuestionData?.choices[i] || ""}
                          onChange={(e) => {
                            if (!editQuestionData) return;
                            const newChoices = [...editQuestionData.choices];
                            newChoices[i] = e.target.value;
                            setEditQuestionData({ ...editQuestionData, choices: newChoices });
                          }}
                        />
                      ) : (
                        q.choices[i] ?? ""
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    {editingId === q.id ? (
                      <TextField
                        type="number"
                        value={editQuestionData?.answer ?? ""}
                        onChange={(e) =>
                          setEditQuestionData((prev) => prev ? { ...prev, answer: Number(e.target.value) } : null)
                        }
                      />
                    ) : (
                      q.answer
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === q.id ? (
                      <>
                        <Button size="small" onClick={handleSaveClick}>保存</Button>
                        <Button size="small" onClick={() => setEditingId(null)}>キャンセル</Button>
                      </>
                    ) : (
                      <Button size="small" onClick={() => handleEditClick(q)}>編集</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Host;