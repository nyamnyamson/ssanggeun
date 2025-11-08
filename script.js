document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // ✨ 여기에 오늘의 정답을 설정하시오 ✨
    // ----------------------------------------
    const ANSWER = "하늘"; // <-- 모든 방문자가 풀 동일한 정답
    
    // ----------------------------------------
    // ✨ 여기에 그대의 사이트 주소를 넣으시오 ✨
    // ----------------------------------------
    const SITE_URL = "https://nyamnyamson.github.io/ssanggeun-game/"; // <-- 공유할 링크 주소

    const MAX_GUESSES = 7;
    const WORD_LENGTH = 2;

    const board = document.getElementById('game-board');
    const guessInput = document.getElementById('guess-input');
    const submitButton = document.getElementById('submit-button');
    const messageArea = document.getElementById('message-area');
    const shareArea = document.getElementById('share-area'); // [추가됨]
    const shareLink = document.getElementById('share-link'); // [추가됨]

    let currentRow = 0;
    let cells = [];
    let emojiCells = []; 
    let emojiHistory = []; // [추가됨] 공유를 위해 이모지 기록 저장

    // 한글 자모 분해 상수 (규칙 적용)
    const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    
    const JAMO_MAP = {
        'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
        'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'], 'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ']
    };

    // [수정됨] 힌트 문자열을 이모지로 변환하는 맵 (밖으로 뺌)
    const hintToEmoji = {
        'carrot': '🥕',
        'mushroom': '🍄',
        'garlic': '🧄',
        'eggplant': '🍆',
        'banana': '🍌',
        'apple': '🍎'
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

    // 힌트 판정 (핵심 로직) - (이전과 동일)
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

            if (g === a) {
                hints[i] = "carrot";
            }
            else if (intersectionWithAll === 0) {
                hints[i] = "apple";
            }
            else if (intersectionWithThis === 0 && intersectionWithOther > 0) {
                hints[i] = "banana";
            }
            else if (intersectionWithThis === 1) {
                hints[i] = "eggplant";
            }
            else if (intersectionWithThis >= 2 && gCho === aCho) {
                hints[i] = "mushroom";
            }
            else if (intersectionWithThis >= 2 && gCho !== aCho) {
                hints[i] = "garlic";
            }
            else if (intersectionWithThis > 0) {
                 hints[i] = "eggplant"; 
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
        let currentEmojiRow = ""; // [추가됨] 현재 줄의 이모지를 기록

        for (let i = 0; i < WORD_LENGTH; i++) {
            const cellIndex = currentRow * WORD_LENGTH + i;
            const emojiCellIndex = currentRow * WORD_LENGTH + i; 
            const emoji = hintToEmoji[hints[i]] || ''; // [수정됨]

            cells[cellIndex].textContent = guess[i];
            cells[cellIndex].classList.add(hints[i]);
            
            emojiCells[emojiCellIndex].textContent = emoji; 
            currentEmojiRow += emoji + (i === 0 ? '' : ''); // [추가됨] 첫번째 이모지와 두번째 이모지 (공백 없이)
        }

        emojiHistory.push(currentEmojiRow); // [추가됨] 현재 줄의 이모지 기록을 히스토리에 저장
        currentRow++;
        guessInput.value = "";

        if (hints[0] === 'carrot' && hints[1] === 'carrot') {
            showMessage("🥕 쌍근! 🥕 승리를 축하하오!");
            endGame(true); // [수정됨] 승리 여부 전달
            return;
        }

        if (currentRow === MAX_GUESSES) {
            showMessage(`패배... 정답은 [ ${ANSWER} ] 였소. 🐯`);
            endGame(false); // [수정됨] 패배 여부 전달
        }
    }

    // [수정됨] 게임 종료 로직 (공유 기능 추가)
    function endGame(isWin) {
        guessInput.disabled = true;
        submitButton.disabled = true;

        // 1. 공유할 텍스트 생성
        const attempts = isWin ? currentRow : 'X'; // 승리 시 현재 줄, 패배 시 'X' (혹은 7)
        let shareText = `냠냠슨 쌍근 ${attempts}/${MAX_GUESSES}\n`; // 그대의 예시 제목
        
        // 이모지 히스토리를 텍스트에 추가
        for (const emojiRow of emojiHistory) {
            shareText += emojiRow + '\n';
        }
        
        shareText += SITE_URL; // 사이트 주소 추가

        // 2. 공유 링크 표시
        shareArea.style.display = 'block';

        // 3. 공유 링크에 클립보드 복사 기능 연결
        shareLink.addEventListener('click', (e) => {
            e.preventDefault(); // 링크의 기본 동작(이동) 방지
            
            // navigator.clipboard API (최신 브라우저 방식)
            navigator.clipboard.writeText(shareText).then(() => {
                showMessage("결과가 클립보드에 복사되었소! 📋");
            }).catch(err => {
                console.error("복사 실패:", err);
                showMessage("복사에 실패했소...");
            });
        });
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
