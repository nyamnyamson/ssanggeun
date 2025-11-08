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
    let emojiCells = []; 

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
        for (let i = 0; i < MAX_GUESSES; i++) {
            const cell1 = document.createElement('div');
            cell1.classList.add('cell');
            board.appendChild(cell1);
            cells.push(cell1);

            const emoji1 = document.createElement('div');
            emoji1.classList.add('emoji-cell');
            board.appendChild(emoji1);
            emojiCells.push(emoji1);

            const cell2 = document.createElement('div');
            cell2.classList.add('cell');
            board.appendChild(cell2);
            cells.push(cell2);

            const emoji2 = document.createElement('div');
            emoji2.classList.add('emoji-cell');
            board.appendChild(emoji2);
            emojiCells.push(emoji2);
        }
    }

    // 한글 글자를 자모 배열로 분해하는 함수
    function getJamos(char) {
        const code = char.charCodeAt(0);
        if (code < 44032 || code > 55203) return [char]; 

        const charCode = code - 44032;
        const choIdx = Math.floor(charCode / (21 * 28));
        const jungIdx = Math.floor((charCode % (21 * 28)) / 28);
        const jongIdx = charCode % 28;

        let jamos = [];
        jamos.push(CHO[choIdx]); 

        const jung = JUNG[jungIdx];
        jamos.push(...(JAMO_MAP[jung] || [jung])); 

        if (jongIdx > 0) {
            const jong = JONG[jongIdx];
            jamos.push(...(JAMO_MAP[jong] || [jong])); 
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

    // 힌트 판정 (핵심 로직)
    function checkGuess(guess) {
        const guessJamos = [getJamos(guess[0]), getJamos(guess[1])];
        const answerJamos = [getJamos(ANSWER[0]), getJamos(ANSWER[1])];
        const allAnswerJamos = new Set([...answerJamos[0], ...answerJamos[1]]);

        let hints = ["", ""];

        for (let i = 0; i < WORD_LENGTH; i++) {
            const g = guess[i];
            const a = ANSWER[i];
            
            const gJamos = guessJamos[i];
            const aJamos = answerJamos[i];
            const otherAJamos = answerJamos[(i + 1) % 2];

            const gCho = gJamos[0];
            const aCho = aJamos[0];

            const intersectionWithThis = getIntersectionSize(gJamos, aJamos);
            const intersectionWithOther = getIntersectionSize(gJamos, otherAJamos);
            const intersectionWithAll = getIntersectionSize(gJamos, [...allAnswerJamos]);

            // --- [수정됨] 힌트 판정 순서를 새 규칙에 맞게 변경 ---

            // 1. 당근 (정확히 일치)
            if (g === a) {
                hints[i] = "carrot";
            }
            // 6. 사과 (정답 두 글자 모두에서 일치하는 자모가 없음)
            else if (intersectionWithAll === 0) {
                hints[i] = "apple";
            }
            // 5. 바나나 (해당 칸 0개 일치, 반대 칸 1개 이상 일치)
            else if (intersectionWithThis === 0 && intersectionWithOther > 0) {
                hints[i] = "banana";
            }
            // 4. 가지 (해당 칸에 정확히 1개 일치)
            else if (intersectionWithThis === 1) {
                hints[i] = "eggplant";
            }
            // 2. 버섯 (해당 칸 2개 이상 일치 + 첫 자음 일치)
            else if (intersectionWithThis >= 2 && gCho === aCho) {
                hints[i] = "mushroom";
            }
            // 3. 마늘 (해당 칸 2개 이상 일치 + 첫 자음 불일치)
            else if (intersectionWithThis >= 2 && gCho !== aCho) {
                hints[i] = "garlic";
            }
            // 혹시 모를 예외 처리 (규칙에 맞지 않는 경우, 예: 1개 일치인데 바나나 조건도 만족 등)
            // 위에서 가지(1개)가 먼저 걸러지므로, 이쪽으로 내려온 intersection > 0 은 사실상 마늘/버섯 조건임
            // 만약의 경우를 대비해 둠.
            else if (intersectionWithThis > 0) {
                 // 1개는 가지에서, 2개 이상은 버섯/마늘에서 걸러져야 함.
                 // 여기까지 왔다면 논리 오류이거나, '가지'와 조건이 겹친 것이므로 '가지'로 처리.
                 hints[i] = "eggplant"; 
            }
            else {
                // '사과'와 '바나나'가 이미 위에서 처리되었어야 함.
                hints[i] = "apple"; // 최종 안전망
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
        // (나중에 표준어 API 검증을 여기에 추가할 수 있소)

        const hints = checkGuess(guess);

        const hintToEmoji = {
            'carrot': '🥕',
            'mushroom': '🍄',
            'garlic': '🧄',
            'eggplant': '🍆',
            'banana': '🍌',
            'apple': '🍎'
        };

        for (let i = 0; i < WORD_LENGTH; i++) {
            const cellIndex = currentRow * WORD_LENGTH + i;
            const emojiCellIndex = currentRow * WORD_LENGTH + i; 

            cells[cellIndex].textContent = guess[i];
            cells[cellIndex].classList.add(hints[i]);
            
            emojiCells[emojiCellIndex].textContent = hintToEmoji[hints[i]] || ''; 
        }

        currentRow++;
        guessInput.value = "";

        if (hints[0] === 'carrot' && hints[1] === 'carrot') {
            showMessage("🥕 쌍근! 🥕 승리를 축하하오!");
            endGame(true);
            return;
        }

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

    createBoard();
});
