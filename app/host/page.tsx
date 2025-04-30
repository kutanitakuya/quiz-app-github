'use client';
import React, { useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, deleteDoc, getDocs, addDoc } from "firebase/firestore";

const Host: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [duration, setDuration] = useState(10); // 秒数

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

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
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">出題者画面</h2>

      <label className="block mb-2">
        問題文：
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>

      <div className="mb-4">
        選択肢：
        {choices.map((choice, idx) => (
          <input
            key={idx}
            type="text"
            className="w-full border p-2 rounded mt-1 mb-1"
            placeholder={`選択肢 ${idx + 1}`}
            value={choice}
            onChange={(e) => handleChoiceChange(idx, e.target.value)}
          />
        ))}
      </div>

      <label className="block mb-4">
        制限時間（秒）：
        <input
          type="number"
          className="w-full border p-2 rounded mt-1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </label>

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        回答受付
      </button>

      <button
        onClick={addQuestion}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        問題送信
      </button>
    </div>
  );
};

export default Host;