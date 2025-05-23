'use client';
import React, { useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, deleteDoc, getDocs, addDoc } from "firebase/firestore";
import './page.css';

const Host: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [duration, setDuration] = useState(10); // 秒数

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
    </div>
  );
};

export default Host;