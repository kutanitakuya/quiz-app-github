import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";

const Participant: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [remainingTime, setRemainingTime] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentQuestionRef = doc(db, "quiz", "currentQuestion");

  // タイマー更新
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (remainingTime > 0) {
      timer = setTimeout(() => setRemainingTime((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [remainingTime]);

  // Firestore の監視
  useEffect(() => {
    const unsubscribe = onSnapshot(currentQuestionRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setQuestion(data.question);
        setChoices(data.choices);
        setDuration(data.duration);
        setRemainingTime(data.duration);
        setHasAnswered(false); // 新しい問題が来たらリセット
      }
    });
    return () => unsubscribe();
  }, []);

  // 回答を送信
  const handleAnswer = async (choiceIndex: number) => {
    if (hasAnswered || remainingTime <= 0) return;

    const answersRef = collection(currentQuestionRef, "answers");

    // 同じ参加者が重複して回答しないように判定（今はランダム、将来的にはuidなどで管理）
    await addDoc(answersRef, {
      choiceIndex,
      answeredAt: serverTimestamp(),
    });

    setHasAnswered(true);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">参加者画面</h2>

      {question ? (
        <>
          <p className="mb-2 font-semibold">Q. {question}</p>
          <div className="mb-4">
            {choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={hasAnswered || remainingTime <= 0}
                className={`w-full text-left mb-2 px-4 py-2 rounded border ${
                  hasAnswered ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <p>残り時間：{remainingTime} 秒</p>
          {hasAnswered && <p className="text-green-600 mt-2">回答しました！</p>}
        </>
      ) : (
        <p>現在、出題中の問題はありません。</p>
      )}
    </div>
  );
};

export default Participant;