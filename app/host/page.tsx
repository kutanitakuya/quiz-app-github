'use client';
import React, { useEffect, useState } from "react";
import { db, storage } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, deleteDoc, getDocs, addDoc, query, orderBy, Timestamp, getDoc } from "firebase/firestore";
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
import { getStorage, ref as strRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteObject } from "firebase/storage";
import { CircularProgress } from "@mui/material";

type Choice = {
  text: string;
  imageUrl?: string;
  file?: File;
  deleted?: boolean;
  deletedUrl?: string;
};

type ReceiveQuestion = {
  id: string;
  duration: number;
  question: string;
  choices: Choice[];
  timestamp: Timestamp;
  createdAt: Timestamp;
  answer: number;
};



const Host: React.FC = () => {
  const [question, setQuestion] = useState("");
  // const [choices, setChoices] = useState(["", "", "", ""]);
  const [choices, setChoices] = useState<Choice[]>([
  { text: "", imageUrl: "" },
  { text: "", imageUrl: "" },
  { text: "", imageUrl: "" },
  { text: "", imageUrl: "" },
]);
  const [duration, setDuration] = useState(10); // 秒数
  const [answer, setAnswer] = useState("");
  const [choiceCount, setChoiceCount] = useState(4); // ← 2 または 4 を選べる
  const [receiveQuestions, setReceiveQuestions] = useState<ReceiveQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // 編集中の問題のID
  const [editQuestionData, setEditQuestionData] = useState<ReceiveQuestion | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], text: value };
    setChoices(newChoices);
  };

  // フォームが未入力かどうかをチェック
  // 問題文, 選択肢, 制限時間 のいずれかが空の場合は true を返し、問題送信ボタンを押せないようにする。
  const isFormIncomplete = () =>
  question.trim() === "" ||
  choices.some((choice) => choice.text.trim() === "") ||
  !duration || isNaN(duration) || selectedAnswer === null;

  // Firestore から問題を取得して表示する
  useEffect(() => {
    const fetchQuestions = async () => {
      const q = query(collection(db, "questions"), orderBy("createdAt", "asc"));
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
        if (newChoices[i] === undefined) newChoices[i] = { text: "", imageUrl: "" };
      }
      return newChoices;
    });
  }, [choiceCount]);

  // 問題を Firestore に追加する関数
  const addQuestion = async () => {
    if (!question.trim()) return alert("問題文が空です");
    if (choices.some((c) => !c.text && !c.file)) return alert("選択肢にテキストまたは画像が必要です");

    setIsSubmitting(true); // ここでローディング開始

    try {
        const questionsRef = collection(db, "questions");

        // 画像をアップロード
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

        await addDoc(questionsRef, {
          question,
          choices: uploadedChoices,
          duration,
          answer: selectedAnswer,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        alert("問題を追加しました！");

        setQuestion("");
        setChoices([
          { text: "", imageUrl: "" },
          { text: "", imageUrl: "" },
          { text: "", imageUrl: "" },
          { text: "", imageUrl: "" },
        ]);
        setDuration(10);

        const snapshot = await getDocs(query(collection(db, "questions"), orderBy("createdAt", "asc")));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ReceiveQuestion, "id">),
        }));
        setReceiveQuestions(list);
      } catch (err) {
        console.error("追加エラー", err);
        alert("問題の追加に失敗しました");
      } finally {
        setIsSubmitting(false); // 処理完了でローディング終了
      }
  };

  // 問題を編集する関数
  const handleEditClick = (question: ReceiveQuestion) => {
    setEditingId(question.id);
    setEditQuestionData({ ...question });
  };

  // 問題を保存する関数
  const handleSaveClick = async () => {
    if (!editQuestionData) return;

    setIsEditSubmitting(true);

    try {
      const uploadedChoices = await Promise.all(
        editQuestionData.choices.map(async (c) => {
          // 古い画像を削除（deletedUrl がある場合）
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

          return {
            text: c.text,
            imageUrl,
          };
        })
      );

      const refDoc = doc(db, "questions", editQuestionData.id);
      await setDoc(refDoc, {
        ...editQuestionData,
        choices: uploadedChoices,
        timestamp: serverTimestamp(),
      });

      setEditingId(null);

      // 再取得
      const snapshot = await getDocs(query(collection(db, "questions"), orderBy("createdAt", "asc")));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReceiveQuestion, "id">),
      }));
      setReceiveQuestions(list);

    } catch (err) {
      console.error("編集保存エラー:", err);
      alert("保存に失敗しました");
    } finally {
      setIsEditSubmitting(false); // ← 終了
    }
  };

  // 問題を削除する関数
  const deleteQuestion = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      // Firestore から問題を取得（画像URLを含む choices を得るため）
      const docRef = doc(db, "questions", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as ReceiveQuestion;

        // Storage にある画像を削除
        for (const choice of data.choices) {
          if (typeof choice === "object" && choice.imageUrl) {
            try {
              const storage = getStorage();
              const decodedPath = decodeURIComponent(new URL(choice.imageUrl).pathname.split('/o/')[1]);
              const imageRef = strRef(storage, decodedPath);
              await deleteObject(imageRef);
            } catch (err) {
              console.warn("画像削除に失敗:", err);
            }
          }
        }
      }

      // Firestore のドキュメントを削除
      await deleteDoc(docRef);

      // 最新の一覧を取得
      const q = query(collection(db, "questions"), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReceiveQuestion, "id">),
      }));
      setReceiveQuestions(list);

    } catch (error) {
      console.error("削除中にエラー:", error);
      alert("削除に失敗しました");
    }
  };


  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
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
        <RadioGroup value={choiceCount} onChange={(e) => setChoiceCount(Number(e.target.value))}>
          <FormControlLabel value={2} control={<Radio />} label="2つ" />
          <FormControlLabel value={4} control={<Radio />} label="4つ" />
        </RadioGroup>
      </FormControl>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {choices.slice(0, choiceCount).map((choice, idx) => (
          <Grid key={idx}>
            <TextField
              fullWidth
              sx={{ mb: 0.3, minWidth: 200, maxWidth: 300 }}
              label={`選択肢 ${idx + 1}`}
              value={choice.text}
              onChange={(e) => {
                const updated = [...choices];
                updated[idx].text = e.target.value;
                setChoices(updated);
              }}
            />
            {/* +画像ボタン（画像未選択時のみ表示） */}
              {!choice.file && !choice.imageUrl && (
                <Button
                  variant="outlined"
                  component="label"
                >
                  + 画像
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const updated = [...choices];
                        updated[idx].file = file;
                        setChoices(updated);
                      }
                    }}
                  />
                </Button>
              )}

              {/* 選択済み画像 + 削除ボタン */}
              {(choice.file || choice.imageUrl) && (
                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  {/* 画像プレビュー（file があれば FileReader、なければ URL） */}
                  <Typography variant="body2" color="green">
                    {choice.file?.name ?? "画像選択済み"}
                  </Typography>
                  <Button
                    variant="text"
                    size="medium"
                    sx={{ minWidth: 30, padding: "2px 6px" }}
                    onClick={() => {
                      const updated = [...choices];
                      updated[idx].file = undefined;
                      updated[idx].imageUrl = undefined;
                      setChoices(updated);
                    }}
                  >
                    ×
                  </Button>
                </Box>
              )}
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
              label={`${idx + 1}`}
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

      <Box mb={2} display="flex" gap={2} alignItems="center">
        <Button
          variant="contained"
          color="primary"
          disabled={isFormIncomplete() || isSubmitting}
          onClick={addQuestion}
        >
          {isSubmitting ? "アップロード中..." : "問題追加"}
        </Button>

        {isSubmitting && <CircularProgress size={24} color="primary" />}
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>問題一覧</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 62 }}>番号</TableCell>
                <TableCell sx={{ minWidth: 140 }}>問題</TableCell>
                <TableCell sx={{ minWidth: 140 }}>選択肢1</TableCell>
                <TableCell sx={{ minWidth: 140 }}>選択肢2</TableCell>
                <TableCell sx={{ minWidth: 140 }}>選択肢3</TableCell>
                <TableCell sx={{ minWidth: 140 }}>選択肢4</TableCell>
                <TableCell sx={{ minWidth: 62 }}>答え</TableCell>
                <TableCell sx={{ minWidth: 62 }}>時間</TableCell>
                <TableCell sx={{ minWidth: 120 }}align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receiveQuestions.map((q, index) => (
                <TableRow key={q.id}>
                  <TableCell>{index + 1}</TableCell>
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
                        <>
                          {/* テキスト編集 */}
                          <TextField
                            fullWidth
                            value={editQuestionData?.choices[i]?.text || ""}
                            onChange={(e) => {
                              if (!editQuestionData) return;
                              const updatedChoices = [...editQuestionData.choices];
                              updatedChoices[i] = {
                                ...updatedChoices[i],
                                text: e.target.value,
                              };
                              setEditQuestionData({
                                ...editQuestionData,
                                choices: updatedChoices,
                              });
                            }}
                          />

                          {/* 画像プレビュー（すでにある場合） */}
                          {editQuestionData?.choices[i]?.imageUrl && !editQuestionData?.choices[i]?.deleted && (
                            <Box mt={1} display="flex" alignItems="center" gap={1}>
                              <img
                                src={editQuestionData.choices[i].imageUrl}
                                alt={`選択肢${i + 1}`}
                                style={{ maxHeight: 60 }}
                              />
                              <Button
                                size="small"
                                onClick={() => {
                                  if (!editQuestionData) return;
                                  const updatedChoices = [...editQuestionData.choices];
                                  updatedChoices[i] = {
                                    ...updatedChoices[i],
                                    deletedUrl: updatedChoices[i].imageUrl, // ← 元画像の削除URLとして保持
                                    imageUrl: "",                            // 表示は消す
                                    deleted: false,                          // 削除対象として別変数で管理
                                  };
                                  setEditQuestionData({
                                    ...editQuestionData,
                                    choices: updatedChoices,
                                  });
                                }}
                              >
                                ×
                              </Button>
                            </Box>
                          )}

                          {/* 画像が未設定ならアップロードボタン表示 */}
                          {!editQuestionData?.choices[i]?.imageUrl || editQuestionData?.choices[i]?.deleted ? (
                            <Button
                              variant="outlined"
                              component="label"
                              size="small"
                              sx={{ mt: 1 }}
                            >
                              + 画像
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !editQuestionData) return;

                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const previewUrl = reader.result as string;
                                    const updatedChoices = [...editQuestionData.choices];
                                    updatedChoices[i] = {
                                      ...updatedChoices[i],
                                      imageUrl: previewUrl,
                                      file,
                                      // deletedUrl は変更しない（古い画像削除のため残しておく）
                                    };
                                    setEditQuestionData({
                                      ...editQuestionData,
                                      choices: updatedChoices,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {/* テキスト */}
                          {q.choices[i]?.text ?? ""}

                          {/* 画像 */}
                          {q.choices[i]?.imageUrl && (
                            <img
                              src={q.choices[i].imageUrl}
                              alt={`選択肢${i + 1}`}
                              style={{ display: "block", maxHeight: 60, marginTop: 4 }}
                            />
                          )}
                        </>
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
                      <TextField
                        type="number"
                        value={editQuestionData?.duration ?? ""}
                        onChange={(e) =>
                          setEditQuestionData((prev) => prev ? { ...prev, duration: Number(e.target.value) } : null)
                        }
                      />
                    ) : (
                      q.duration
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      {editingId === q.id ? (
                        <>
                          <Button
                            size="small"
                            onClick={handleSaveClick}
                            disabled={isEditSubmitting}
                          >
                            {isEditSubmitting ? "保存中..." : "保存"}
                          </Button>
                          {isEditSubmitting && <CircularProgress size={20} sx={{ ml: 1 }} />}
                          <Button
                            size="small"
                            onClick={() => setEditingId(null)}
                            disabled={isEditSubmitting}
                          >
                            キャンセル
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" onClick={() => handleEditClick(q)}>編集</Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteQuestion(q.id)}
                          >
                            削除
                          </Button>
                        </>
                      )}
                    </Box>
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