'use client';
import React, { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, deleteDoc, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import './page.css';

type ReceiveQuestion = {
  id: string;
  question: string;
  choices: string[];
  order: number;
};

const Host: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [duration, setDuration] = useState(10); // 秒数
  const [receiveQuestions, setReceiveQuestions] = useState<ReceiveQuestion[]>([]);

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
      timestamp: serverTimestamp(),
    });

    alert("問題を送信しました！");
    // 入力された値をクリアする。
    setQuestion("");
    setChoices(["", "", "", ""]);
    setDuration(10);
  };

  const addQuestion = async () => {
    const questionsRef = collection(db, "questions");

    // 新しい問題を Firestore に送信
    await addDoc(questionsRef, {
      question,
      choices,
      duration,
      timestamp: serverTimestamp(),
    });

    alert("問題を送信しました！");
  };

  return (
    <div className="">
      <h2 className="">出題者画面</h2>

      <label className="block mb-2">
        問題文：
        <textarea
          className="w-full aiueo"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>

      <div className="">
        選択肢：
        {choices.map((choice, idx) => (
          <textarea
            key={idx}
            className="w-full"
            placeholder={`選択肢 ${idx + 1}`}
            value={choice}
            onChange={(e) => handleChoiceChange(idx, e.target.value)}
          />
        ))}
      </div>

      <label className="">
        制限時間（秒）：
        <textarea
          className="w-full"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </label>

      
        <p></p>
      <button
        onClick={addQuestion}
        className="button005"
        disabled={isFormIncomplete}
      >
        問題追加
      </button>
      <p></p>

      <button
        onClick={handleSubmit}
        className=""
      >
        回答受付
      </button>
      
      <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">問題一覧</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">番号</th>
              <th className="border px-4 py-2">問題</th>
              <th className="border px-4 py-2">選択肢１</th>
              <th className="border px-4 py-2">選択肢２</th>
              <th className="border px-4 py-2">選択肢３</th>
              <th className="border px-4 py-2">選択肢４</th>
            </tr>
          </thead>
          <tbody>
            {receiveQuestions.map((q) => (
              <tr key={q.id}>
                <td className="border px-4 py-2 text-center">{q.order}</td>
                <td className="border px-4 py-2">{q.question}</td>
                {Array.from({ length: 4 }).map((_, i) => (
                  <td key={i} className="border px-4 py-2">
                    {q.choices[i] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    </div>
  );
};

export default Host;