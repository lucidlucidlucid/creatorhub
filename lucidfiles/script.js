// Obfuscated password whitelist using reverse + ROT13 (letters only)
// Encoded as XOR(key=73) bytes with 255 as delimiter between entries to avoid readable strings in source
const OBFUSCATED_PACKED = new Uint8Array([
  126,127,12,27,14,7,3,255,         
  16,7,15,12,27,0,31,15,0,31,8,1,255, 
  124,127,14,15,27,1,29,255,           
  123,113,113,8,31,19,24,7,255         
]);

function decodePacked(bytes, key){
  const out = [];
  let buf = [];
  for(let i=0;i<bytes.length;i++){
    const b = bytes[i];
    if(b === 255){
      const s = String.fromCharCode.apply(null, buf.map(n => n ^ key));
      out.push(s);
      buf = [];
    } else {
      buf.push(b);
    }
  }
  return out;
}

const OBFUSCATED_PASSWORDS = new Set(decodePacked(OBFUSCATED_PACKED, 73));

function rot13(s){
  return s.replace(/[A-Za-z]/g, c =>
    String.fromCharCode(
      c <= 'Z'
        ? ((c.charCodeAt(0) - 65 + 13) % 26) + 65
        : ((c.charCodeAt(0) - 97 + 13) % 26) + 97
    )
  );
}

function obfuscateCandidate(input){
  const reversed = input.split('').reverse().join('');
  return rot13(reversed).toUpperCase();
}
const DRIVE_ITEMS = [{ id: 1, name: 'gorilla tag.rar', url: 'https://www.dropbox.com/scl/fi/bwi79w2lx9b830tenm0ne/Gorilla-Tag.rar?rlkey=dfwjqzqaijls1zby27m1stecb&st=cpfnbtyj&dl=1' }];

const outputEl = document.getElementById('output');
const commandInput = document.getElementById('command');

let history = [];
let historyIndex = -1;

function print(text, className){
  if(!outputEl) return;
  const line = document.createElement('div');
  if(className) line.className = className;
  outputEl.appendChild(line);
  let i = 0;
  const type = () => {
    line.textContent = text.slice(0, i++);
    outputEl.scrollTop = outputEl.scrollHeight;
    if(i <= text.length) requestAnimationFrame(type);
  };
  type();
}

function printWelcome(){
  print('terminal access');
  print('tip: type /password <code> to unlock downloads', 'muted');
  print('type /help for commands', 'muted');
}

function setAccessGranted(){
  sessionStorage.setItem('access-granted','1');
}
function isAccessGranted(){
  return sessionStorage.getItem('access-granted') === '1';
}

function handlePassword(args){
  const value = (args || '').trim();
  if(!value){ print('usage: /password <code>', 'muted'); return; }
  const obf = obfuscateCandidate(value);
  if(OBFUSCATED_PASSWORDS.has(obf)){
    setAccessGranted();
    print('access: granted', '');
  } else {
    print('access: denied', 'muted');
    triggerShake();
  }
}

function handleList(){
  DRIVE_ITEMS.forEach(item => {
    print(`[${item.id}] ${item.name}`);
  });
}

function handleDownload(args){
  const n = parseInt((args || '').trim(), 10);
  if(Number.isNaN(n)){ print('usage: /download <number>', 'muted'); return; }
  const item = DRIVE_ITEMS.find(x => x.id === n);
  if(!item){ print('not found', 'muted'); triggerShake(); return; }
  if(!isAccessGranted()){ print('require: /password first (e.g., /password testtesttest)', 'muted'); triggerShake(); return; }
  print(`downloading: ${item.name}`);
  window.open(item.url, '_blank', 'noopener');
}

function handleClear(){
  if(!outputEl) return;
  outputEl.textContent = '';
}

function handleHelp(){
  print('/password <code>    set access');
  print('/list               list downloads');
  print('/download <n>       download item by number');
  print('/clear              clear screen');
}

function handleCommand(cmd){
  const raw = cmd.trim();
  if(!raw) return;
  history.push(raw);
  historyIndex = history.length;
  print(`> ${raw}`, '');

  if(raw.startsWith('/password')){
    handlePassword(raw.slice('/password'.length));
    return;
  }
  if(raw === '/list' || raw === '/ls'){
    handleList();
    return;
  }
  if(raw.startsWith('/download')){
    handleDownload(raw.slice('/download'.length));
    return;
  }
  if(raw === '/clear'){
    handleClear();
    return;
  }
  if(raw === '/help'){
    handleHelp();
    return;
  }
  print('unknown command. try /help', 'muted');
  triggerShake();
}

function initTerminal(){
  if(!commandInput) return;
  commandInput.classList.add('blink');
  // Require fresh password per visit
  sessionStorage.removeItem('access-granted');
  printWelcome();

  commandInput.addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      e.preventDefault();
      const value = commandInput.value;
      commandInput.value = '';
      handleCommand(value);
      return;
    }
    if(e.key === 'ArrowUp'){
      if(history.length){
        e.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        commandInput.value = history[historyIndex] || '';
        setTimeout(()=>commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length),0);
      }
      return;
    }
    if(e.key === 'ArrowDown'){
      if(history.length){
        e.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        commandInput.value = history[historyIndex] || '';
        setTimeout(()=>commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length),0);
      }
      return;
    }
    if(e.key === 'Escape'){
      commandInput.value = '';
      return;
    }
  });
}

initTerminal();

function triggerShake(){
  const terminal = document.querySelector('.terminal');
  if(!terminal) return;
  terminal.classList.remove('shake');
  // force reflow
  void terminal.offsetWidth;
  terminal.classList.add('shake');
}
