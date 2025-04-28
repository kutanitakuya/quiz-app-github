// import { useState, useEffect } from 'react';
// import { db } from '../lib/firebase'; // Firebase設定済みファイルをimport
// import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// // 出題者用コンポーネント
// export function QuizMaster() {
//   const [question, setQuestion] = useState('');
//   const [choices, setChoices] = useState(['', '', '', '']);

//   const handleSubmit = async () => {
//     const quizRef = doc(db, 'quiz', 'current'); // 現在の問題を保存する固定ID
//     await setDoc(quizRef, {
//       question,
//       choices,
//       timestamp: new Date()
//     });
//   };

//   return (
//     <div>
//       <h2>クイズ作成</h2>
//       <input
//         type="text"
//         placeholder="問題を入力"
//         value={question}
//         onChange={(e) => setQuestion(e.target.value)}
//       />
//       {choices.map((choice, index) => (
//         <input
//           key={index}
//           type="text"
//           placeholder={`選択肢 ${index + 1}`}
//           value={choice}
//           onChange={(e) => {
//             const newChoices = [...choices];
//             newChoices[index] = e.target.value;
//             setChoices(newChoices);
//           }}
//         />
//       ))}
//       <button onClick={handleSubmit}>回答受付</button>
//     </div>
//   );
// }

// // 回答者用コンポーネント
// export function QuizParticipant() {
//   const [questionData, setQuestionData] = useState(null);

//   useEffect(() => {
//     const quizRef = doc(db, 'quiz', 'current');
//     const unsubscribe = onSnapshot(quizRef, (doc) => {
//       if (doc.exists()) {
//         setQuestionData(doc.data());
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <div>
//       <h2>クイズ</h2>
//       {questionData ? (
//         <div>
//           <h3>{questionData.question}</h3>
//           <ul>
//             {questionData.choices.map((choice, index) => (
//               <li key={index}>{choice}</li>
//             ))}
//           </ul>
//         </div>
//       ) : (
//         <p>問題待機中...</p>
//       )}
//     </div>
//   );
// }
