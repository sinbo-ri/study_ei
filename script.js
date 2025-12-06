// グローバル変数
let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let currentStreak = 0;
let isRandomMode = false;
let usedQuestions = [];
let currentLesson = 'all'; // 'all', '11', '12'
let currentSubject = 'all'; // 'all', '社会', '理科'
let currentCorrectChoice = 1; // シャッフル後の正解の位置

// DOM要素
const elements = {
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    choices: document.getElementById('choices'),
    choice1: document.getElementById('choice1'),
    choice2: document.getElementById('choice2'),
    choice3: document.getElementById('choice3'),
    choice4: document.getElementById('choice4'),
    quizArea: document.getElementById('quizArea'),
    resultArea: document.getElementById('resultArea'),
    resultIcon: document.getElementById('resultIcon'),
    resultText: document.getElementById('resultText'),
    correctAnswer: document.getElementById('correctAnswer'),
    streakMessage: document.getElementById('streakMessage'),
    nextBtn: document.getElementById('nextBtn'),
    completeArea: document.getElementById('completeArea'),
    progress: document.getElementById('progress'),
    correct: document.getElementById('correct'),
    streak: document.getElementById('streak'),
    orderBtn: document.getElementById('orderBtn'),
    randomBtn: document.getElementById('randomBtn'),
    resetBtn: document.getElementById('resetBtn'),
    retryBtn: document.getElementById('retryBtn'),
    finalCorrect: document.getElementById('finalCorrect'),
    finalTotal: document.getElementById('finalTotal'),
    finalRate: document.getElementById('finalRate'),
    lessonSelect: document.getElementById('lessonSelect'),
    subjectSelect: document.getElementById('subjectSelect')
};

// CSVデータの読み込み
async function loadQuestions() {
    try {
        const response = await fetch('questions.csv');
        const csvText = await response.text();
        
        // CSVをパース
        const lines = csvText.trim().split('\n');
        allQuestions = lines.slice(1).map(line => {
            const parts = line.split(',');
            return {
                question: parts[0].trim(),
                choices: [
                    parts[1].trim(),
                    parts[2].trim(),
                    parts[3].trim(),
                    parts[4].trim()
                ],
                correctAnswer: parseInt(parts[5].trim()),
                subject: parts[6].trim(),
                lesson: parts[7].trim()
            };
        });
        
        console.log(`${allQuestions.length}問の問題を読み込みました`);
        filterQuestions();
        startQuiz();
    } catch (error) {
        console.error('問題の読み込みに失敗しました:', error);
        alert('問題の読み込みに失敗しました。ページを再読み込みしてください。');
    }
}

// 問題をフィルタリング
function filterQuestions() {
    questions = allQuestions.filter(q => {
        const subjectMatch = currentSubject === 'all' || q.subject === currentSubject;
        const lessonMatch = currentLesson === 'all' || q.lesson === currentLesson;
        return subjectMatch && lessonMatch;
    });
    console.log(`${questions.length}問を選択しました（科目:${currentSubject}, 回:${currentLesson}）`);
}

// クイズ開始
function startQuiz() {
    currentQuestionIndex = 0;
    correctCount = 0;
    currentStreak = 0;
    usedQuestions = [];
    
    updateStats();
    showQuestion();
}

// 問題表示
function showQuestion() {
    if (usedQuestions.length >= questions.length) {
        showComplete();
        return;
    }
    
    // ランダムモードの場合、未使用の問題からランダムに選択
    if (isRandomMode) {
        const availableIndices = questions
            .map((_, index) => index)
            .filter(index => !usedQuestions.includes(index));
        
        currentQuestionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
        // 順番モードの場合、次の未使用問題を選択
        currentQuestionIndex = usedQuestions.length;
    }
    
    usedQuestions.push(currentQuestionIndex);
    
    const question = questions[currentQuestionIndex];
    
    elements.questionNumber.textContent = `問題 ${usedQuestions.length}`;
    elements.questionText.textContent = question.question;
    
    // 選択肢をシャッフル
    const shuffledChoices = shuffleChoices(question.choices, question.correctAnswer);
    
    // 選択肢を表示
    elements.choice1.textContent = shuffledChoices.choices[0];
    elements.choice2.textContent = shuffledChoices.choices[1];
    elements.choice3.textContent = shuffledChoices.choices[2];
    elements.choice4.textContent = shuffledChoices.choices[3];
    
    // 正解の位置を保存（1-4）
    currentCorrectChoice = shuffledChoices.correctPosition;
    
    // ボタンをリセット
    const choiceBtns = document.querySelectorAll('.choice-btn');
    choiceBtns.forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
    });
    
    elements.quizArea.classList.remove('hidden');
    elements.resultArea.classList.remove('show');
    elements.completeArea.classList.remove('show');
    
    updateStats();
}

// 選択肢をシャッフルする関数
function shuffleChoices(choices, correctAnswer) {
    // 選択肢と元のインデックスをペアにする
    const choicesWithIndex = choices.map((choice, index) => ({
        text: choice,
        isCorrect: index === correctAnswer - 1
    }));
    
    // Fisher-Yatesアルゴリズムでシャッフル
    for (let i = choicesWithIndex.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choicesWithIndex[i], choicesWithIndex[j]] = [choicesWithIndex[j], choicesWithIndex[i]];
    }
    
    // シャッフル後の正解の位置を見つける
    const correctPosition = choicesWithIndex.findIndex(item => item.isCorrect) + 1;
    
    return {
        choices: choicesWithIndex.map(item => item.text),
        correctPosition: correctPosition
    };
}

// 回答チェック
function checkAnswer(selectedChoice) {
    const isCorrect = selectedChoice === currentCorrectChoice;
    
    // 全てのボタンを無効化
    const choiceBtns = document.querySelectorAll('.choice-btn');
    choiceBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // 選択したボタンに色をつける
    const selectedBtn = document.querySelector(`[data-choice="${selectedChoice}"]`);
    if (isCorrect) {
        selectedBtn.classList.add('correct');
        correctCount++;
        currentStreak++;
    } else {
        selectedBtn.classList.add('incorrect');
        // 正解の選択肢も表示
        const correctBtn = document.querySelector(`[data-choice="${currentCorrectChoice}"]`);
        correctBtn.classList.add('correct');
        currentStreak = 0;
    }
    
    updateStats();
    
    // 正解のテキストを取得
    const correctAnswerText = document.getElementById(`choice${currentCorrectChoice}`).textContent;
    
    // 1秒後に結果画面を表示
    setTimeout(() => {
        showResult(isCorrect, correctAnswerText);
    }, 1000);
}

// 文字列正規化（不要になったので削除）
function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/\s+/g, '')
        .replace(/[　、。]/g, '');
}

// 結果表示
function showResult(isCorrect, correctAnswer) {
    elements.quizArea.classList.add('hidden');
    elements.resultArea.classList.add('show');
    
    if (isCorrect) {
        elements.resultArea.classList.remove('incorrect');
        elements.resultArea.classList.add('correct');
        elements.resultIcon.textContent = '⭕';
        elements.resultText.textContent = '正解！';
        elements.correctAnswer.textContent = '';
        
        // 連続正解メッセージ
        if (currentStreak === 5) {
            elements.streakMessage.textContent = '🎉 5問連続正解！！ 🎉';
            elements.streakMessage.classList.add('show');
        } else if (currentStreak === 10) {
            elements.streakMessage.textContent = '🔥 10問連続正解！！ 🔥';
            elements.streakMessage.classList.add('show');
        } else if (currentStreak === 15) {
            elements.streakMessage.textContent = '⭐ 15問連続正解！！ ⭐';
            elements.streakMessage.classList.add('show');
        } else if (currentStreak === 20) {
            elements.streakMessage.textContent = '👑 全問正解！！完璧です！ 👑';
            elements.streakMessage.classList.add('show');
        } else {
            elements.streakMessage.classList.remove('show');
        }
    } else {
        elements.resultArea.classList.remove('correct');
        elements.resultArea.classList.add('incorrect');
        elements.resultIcon.textContent = '❌';
        elements.resultText.textContent = '不正解';
        elements.correctAnswer.textContent = `正解: ${correctAnswer}`;
        elements.streakMessage.classList.remove('show');
    }
}

// 統計更新
function updateStats() {
    elements.progress.textContent = `${usedQuestions.length}/${questions.length}`;
    elements.correct.textContent = correctCount;
    elements.streak.textContent = currentStreak;
}

// 完了画面表示
function showComplete() {
    elements.quizArea.classList.add('hidden');
    elements.resultArea.classList.remove('show');
    elements.completeArea.classList.add('show');
    
    const rate = Math.round((correctCount / questions.length) * 100);
    
    elements.finalCorrect.textContent = correctCount;
    elements.finalTotal.textContent = questions.length;
    elements.finalRate.textContent = rate;
}

// モード切り替え
function setMode(random) {
    isRandomMode = random;
    
    if (random) {
        elements.randomBtn.classList.remove('btn-secondary');
        elements.randomBtn.classList.add('btn-primary');
        elements.orderBtn.classList.remove('btn-primary');
        elements.orderBtn.classList.add('btn-secondary');
    } else {
        elements.orderBtn.classList.remove('btn-secondary');
        elements.orderBtn.classList.add('btn-primary');
        elements.randomBtn.classList.remove('btn-primary');
        elements.randomBtn.classList.add('btn-secondary');
    }
    
    startQuiz();
}

// イベントリスナー
// 選択肢のクリックイベント
elements.choices.addEventListener('click', (e) => {
    const choiceBtn = e.target.closest('.choice-btn');
    if (choiceBtn && !choiceBtn.disabled) {
        const selectedChoice = parseInt(choiceBtn.dataset.choice);
        checkAnswer(selectedChoice);
    }
});

elements.nextBtn.addEventListener('click', showQuestion);

elements.orderBtn.addEventListener('click', () => setMode(false));

elements.randomBtn.addEventListener('click', () => setMode(true));

elements.resetBtn.addEventListener('click', () => {
    if (confirm('最初からやり直しますか？')) {
        startQuiz();
    }
});

elements.retryBtn.addEventListener('click', () => {
    startQuiz();
});

elements.lessonSelect.addEventListener('change', (e) => {
    currentLesson = e.target.value;
    filterQuestions();
    startQuiz();
});

elements.subjectSelect.addEventListener('change', (e) => {
    currentSubject = e.target.value;
    filterQuestions();
    startQuiz();
});

// 初期化
loadQuestions();
