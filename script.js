document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // ✨ 여기에 오늘의 정답을 설정하시오 ✨
    // ----------------------------------------
    const ANSWER = "하늘"; // <-- 모든 방문자가 풀 동일한 정답

    const MAX_GUESSES = 7;
    const WORD_LENGTH = 2;

    const board = document.getElementById('game-board');
    const guessInput = document.getElementById('guess-input');
    const submitButton = document.getElementById('submit-button');
    const messageArea = document.getElementById('message-area');

    let currentRow = 0;
    let cells = [];
    let emojiCells = []; // [수정됨] 이모지 칸을 저장할 배열 추가

    // 한글 자모 분해 상수 (규칙 적용)
    const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    
    const JAMO_MAP = {
        'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
        'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'], 'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ']
    };

    // 게임판 생성
    function createBoard() {
        // [수정됨] 한 줄에 4개 요소(글자, 이모지, 글자, 이모지)를 생성
        for (let i = 0; i < MAX_GUESSES; i++) {
            // 1번 글자 칸
            const cell1 = document.createElement('div');
            cell1.classList.add('cell');
            board.appendChild(cell1);
            cells.push(cell1);

            // 1번 이모지 칸
            const emoji1 = document.createElement('div');
            emoji1.classList.add('emoji-cell');
            board.appendChild(emoji1);
            emojiCells.push(emoji1);

            // 2번 글자 칸
            const cell2 = document.createElement('div');
            cell2.classList.add('cell');
            board.appendChild(cell2);
            cells.push(cell2);

            // 2번 이모지 칸
            const emoji2 = document.createElement('div');
            emoji2.classList.add('emoji-cell');
            board.appendChild(emoji2);
            emojiCells.push(emoji2);
        }
    }

    // 한글 글자를 자모 배열로 분해하는 함수
    function getJamos(char) {
        const code = char.charCodeAt(0);
        if (code < 44032 || code > 55203) return [char]; // 한글이 아님

        const charCode = code - 44032;
        const choIdx = Math.floor(charCode / (21 * 28));
        const jungIdx = Math.floor((charCode % (21 * 28)) / 28);
        const jongIdx = charCode % 28;

        let jamos = [];
        jamos.push(CHO[choIdx]); // 초성

        const jung = JUNG[jungIdx];
        jamos.push(...(JAMO_MAP[jung] || [jung])); // 중성 (겹모음 분해)

        if (jongIdx > 0) {
            const jong = JONG[jongIdx];
            jamos.push(...(JAMO_MAP[jong] || [jong])); // 종성 (겹받침 분해)
        }
        return jamos;
    }

    // 자모 배열에서 교집합 크기 반환
    function getIntersectionSize(arr1, arr2) {
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        let intersection = 0;
        for (const item of set1) {
            if (set2.has(item)) {
                intersection++;
            }
        }
        return intersection;
    }

    // 힌트 판정 (핵심 로직) - (이 부분은 수정 없음)
    function checkGuess(guess) {
        const guessJamos = [getJamos(guess[0]), getJamos(guess[1])];
        const answerJamos = [getJamos(ANSWER[0]), getJamos(ANSWER[1])];
        const allAnswerJamos = new Set([...answerJamos[0], ...answerJamos[1]]);

        let hints = ["", ""];

        for (let i = 0; i < WORD_LENGTH; i++) {
            const g = guess[i];
            const a = ANSWER[i];
            const otherA = ANSWER[(i + 1) % 2];

            const gJamos = guessJamos[i];
            const aJamos = answerJamos[i];
            const otherAJamos = answerJamos[(i + 1) % 2];

            const gCho = gJamos[0];
            const aCho = aJamos[0];
            const gRest = gJamos.slice(1);
            const aRest = aJamos.slice(1);

            const intersectionWithThis = getIntersectionSize(gJamos, aJamos);
            const intersectionWithOther = getIntersectionSize(gJamos, otherAJamos);
            const intersectionWithAll = getIntersectionSize(gJamos, [...allAnswerJamos]);
            const restIntersection = getIntersectionSize(gRest, aRest);

            if (g === a) {
                hints[i] = "carrot";
            }
            else if (gCho === aCho && restIntersection > 0) {
                hints[i] = "mushroom";
            }
            else if (intersectionWithAll === 0) {
                hints[i] = "apple";
            }
            else if (intersectionWithThis === 0 && intersectionWithOther > 0) {
                hints[i] = "banana";
            }
            else if (gCho !== aCho && intersectionWithThis > 0) {
                hints[i] = "garlic";
            }
            else if (intersectionWithThis === 1) {
                hints[i] = "eggplant";
            }
            else if (intersectionWithThis > 0) {
                hints[i] = "garlic"; 
            }
            else {
                hints[i] = "apple"; 
            }
        }
        return hints;
    }

    // 추측 제출 처리
    function handleSubmit() {
        const guess = guessInput.value.trim();

        if (guess.length !== WORD_LENGTH) {
            showMessage("두 글자를 입력해야 하오.");
            return;
        }

        const hints = checkGuess(guess);

        // [새로 추가됨] 힌트 문자열을 이모지로 변환하는 맵
        const hintToEmoji = {
            'carrot': '🥕',
            'mushroom': '🍄',
            'garlic': '🧄',
            'eggplant': '🍆',
            'banana': '🍌',
            'apple': '🍎'
        };

        // [수정됨] 글자 칸과 이모지 칸을 동시에 업데이트
        for (let i = 0; i < WORD_LENGTH; i++) {
            const cellIndex = currentRow * WORD_LENGTH + i;
            const emojiCellIndex = currentRow * WORD_LENGTH + i; // 글자 칸과 이모지 칸의 인덱스는 동일함

            // 1. 글자 칸 업데이트
            cells[cellIndex].textContent = guess[i];
            cells[cellIndex].classList.add(hints[i]);
            
            // 2. 이모지 칸 업데이트
            emojiCells[emojiCellIndex].textContent = hintToEmoji[hints[i]] || ''; // 힌트에 맞는 이모지 삽입
        }

        currentRow++;
        guessInput.value = "";

        // 승리 판정
        if (hints[0] === 'carrot' && hints[1] === 'carrot') {
            showMessage("🥕 쌍근! 🥕 승리를 축하하오!");
            endGame(true);
            return;
        }

        // 패배 판정
        if (currentRow === MAX_GUESSES) {
            showMessage(`패배... 정답은 [ ${ANSWER} ] 였소. 🐯`);
            endGame(false);
        }
    }

    function endGame(isWin) {
        guessInput.disabled = true;
        submitButton.disabled = true;
    }

    function showMessage(msg) {
        messageArea.textContent = msg;
    }

    guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });

    submitButton.addEventListener('click', handleSubmit);

    // 게임 시작
    createBoard();
});