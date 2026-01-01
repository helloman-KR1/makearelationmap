let selected = null;
let offsetX = 0;
let offsetY = 0;
let selectedPerson = null; 
let personId = 0;

const people = [];
const relations = [];

function randomColor() {
  return `hsl(${Math.random() * 360}, 70%, 60%)`;
}

// 🔹 인물 추가 함수
function addPerson() {
  const nameInput = document.getElementById("nameInput");
  const name = nameInput.value.trim();
  if (!name) return;

  const id = personId++;
  const color = randomColor();

  const div = document.createElement("div");
  div.className = "person";
  div.textContent = name;
  div.dataset.id = id;
  div.style.background = color;
  div.style.left = Math.random() * 300 + 50 + "px";
  div.style.top = Math.random() * 300 + 50 + "px";

  div.addEventListener("mousedown", (e) => {
    selected = div;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    e.stopPropagation();
  });

  div.addEventListener("click", () => handleRelation(div));

  div.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    editPersonName(id);
  });

  div.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if(confirm(`'${name}' 인물을 삭제하시겠습니까?`)) {
      deletePerson(id);
    }
  });

  document.getElementById("canvas").appendChild(div);
  people.push({ id, name, element: div, color });
  renderPersonList();
  nameInput.value = "";
}

// 🔹 인물 목록 렌더링 (색상 선택기 포함)
function renderPersonList() {
  const listContainer = document.getElementById("personList");
  listContainer.innerHTML = "";

  people.forEach(person => {
    const item = document.createElement("div");
    item.className = "person-item";
    item.style.borderLeftColor = person.color;

    // 색상 선택기(input type="color") 추가
    item.innerHTML = `
      <input type="color" value="${rgbToHex(person.element.style.backgroundColor)}" 
             onchange="changePersonColor(${person.id}, this.value)" class="color-picker">
      <span class="person-name-text" onclick="editPersonName(${person.id})">${person.name}</span>
      <button class="delete-btn" onclick="deletePerson(${person.id})">삭제</button>
    `;
    listContainer.appendChild(item);
  });
}

// 🔹 인물 색상 변경
function changePersonColor(id, newColor) {
  const person = people.find(p => p.id === id);
  if (!person) return;
  person.color = newColor;
  person.element.style.background = newColor;
  renderPersonList();
}

// 🔹 이름 수정
function editPersonName(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;
  const newName = prompt("새로운 이름을 입력하세요:", person.name);
  if (newName && newName.trim() !== "") {
    person.name = newName.trim();
    person.element.textContent = person.name;
    renderPersonList();
  }
}

// 🔹 인물 삭제
function deletePerson(id) {
  const index = people.findIndex(p => p.id === id);
  if (index === -1) return;
  people[index].element.remove();
  for (let i = relations.length - 1; i >= 0; i--) {
    const r = relations[i];
    if (r.from == id || r.to == id) {
      r.line.remove();
      r.text.remove();
      relations.splice(i, 1);
    }
  }
  people.splice(index, 1);
  renderPersonList();
  if (selectedPerson && selectedPerson.dataset.id == id) selectedPerson = null;
}

// 🔹 관계 설정 핸들러
function handleRelation(person) {
  if (!selectedPerson) {
    selectedPerson = person;
    person.style.outline = "3px solid #FFD700";
  } else if (selectedPerson === person) {
    selectedPerson.style.outline = "none";
    selectedPerson = null;
  } else {
    if (!relationExists(selectedPerson, person)) {
      createLine(selectedPerson, person);
    }
    selectedPerson.style.outline = "none";
    selectedPerson = null;
  }
}

function relationExists(from, to) {
  return relations.some(r => r.from === from.dataset.id && r.to === to.dataset.id);
}

// 🔹 관계선 생성 (색상 변경 및 삭제 기능 포함)
function createLine(p1, p2) {
  const svg = document.getElementById("lines");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

  line.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    changeRelationColor(relation); // 위에서 만든 함수 호출
  });
  const initialMarkerId = getOrCreateMarker("#555");
  line.setAttribute("marker-end", `url(#${initialMarkerId})`);
  text.textContent = "관계 설명";
  text.setAttribute("class", "relation-text");

  const relation = {
    id: Date.now(),
    from: p1.dataset.id,
    to: p2.dataset.id,
    p1, p2, line, text
  };

  // 선 더블 클릭 시 색상 변경
  line.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    const newColor = prompt("관계선 색상을 입력하세요 (예: red, #FF5733):", "#555");
    if (newColor) {
      line.style.stroke = newColor;
      text.style.fill = newColor;
    }
  });

  // 선 우클릭 시 삭제
  line.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (confirm("이 관계를 삭제하시겠습니까?")) deleteRelation(relation.id);
  });

  // 텍스트 클릭 시 수정/삭제
  text.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = prompt("'수정' 내용을 입력하거나 '삭제'를 입력하세요:", text.textContent);
    if (action === "삭제") deleteRelation(relation.id);
    else if (action) text.textContent = action;
  });

  svg.appendChild(line);
  svg.appendChild(text);
  relations.push(relation);
  updateLines();
}

function deleteRelation(relId) {
  const index = relations.findIndex(r => r.id === relId);
  if (index !== -1) {
    const r = relations[index];
    r.line.remove();
    r.text.remove();
    relations.splice(index, 1);
  }
}

// 🔹 선 위치 업데이트 로직
// 🔹 선 위치 업데이트 로직 (양방향 겹침 해결 버전)
function updateLines() {
  relations.forEach(r => {
    const r1 = r.p1.getBoundingClientRect();
    const r2 = r.p2.getBoundingClientRect();
    const canvas = document.getElementById("canvas").getBoundingClientRect();

    // 기본 중심 좌표 계산
    let x1 = r1.left + r1.width / 2 - canvas.left;
    let y1 = r1.top + r1.height / 2 - canvas.top;
    let x2 = r2.left + r2.width / 2 - canvas.left;
    let y2 = r2.top + r2.height / 2 - canvas.top;

    // 1. 상대방이 나를 가리키는 반대 방향 선이 있는지 확인
    const hasReverse = relations.some(other => other.from === r.to && other.to === r.from);

    // 2. 양방향 관계일 경우 선을 옆으로 살짝 밀기 (Offset)
    if (hasReverse) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      // 수직 벡터를 이용해 15픽셀 정도 옆으로 이동
      const offsetX = (dy / len) * 15;
      const offsetY = (-dx / len) * 15;

      x1 += offsetX;
      y1 += offsetY;
      x2 += offsetX;
      y2 += offsetY;
    
    }

    // 3. 화살표 머리가 원의 테두리에 닿도록 조정
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const radius = 35; // 인물 원 반지름 + 여유 공간
    const edgeX = x2 - Math.cos(angle) * radius;
    const edgeY = y2 - Math.sin(angle) * radius;

    // 4. 속성 적용
    r.line.setAttribute("x1", x1);
    r.line.setAttribute("y1", y1);
    r.line.setAttribute("x2", edgeX);
    r.line.setAttribute("y2", edgeY);
    const currentColor = r.line.style.stroke || "#555"; 
    const markerId = getOrCreateMarker(currentColor);
    r.line.setAttribute("marker-end", `url(#${markerId})`);

    // 5. 텍스트 위치 (선 중앙에서 약간 위로)
    r.text.setAttribute("x", (x1 + edgeX) / 2);
    r.text.setAttribute("y", (y1 + edgeY) / 2 - 10);
  });
}
// 🔹 드래그 및 공통 이벤트
function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  const result = rgb.match(/\d+/g);
  return result ? "#" + result.map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : rgb;
}

document.addEventListener("mousemove", (e) => {
  if (!selected) return;
  const canvas = document.getElementById("canvas").getBoundingClientRect();
  selected.style.left = (e.clientX - canvas.left - offsetX) + "px";
  selected.style.top = (e.clientY - canvas.top - offsetY) + "px";
  updateLines();
});

document.addEventListener("mouseup", () => {
  selected = null;
});
// 🔹 [신규] 특정 색상의 마커가 없으면 생성하는 함수
function getOrCreateMarker(color) {
  const svg = document.getElementById("lines");
  const defs = svg.querySelector("defs") || svg.insertAdjacentElement('afterbegin', document.createElementNS("http://www.w3.org/2000/svg", "defs"));
  
  // 색상 코드에서 #을 제거하여 ID 생성 (예: marker-#ff0000 -> marker-ff0000)
  const safeColor = color.replace("#", "");
  const markerId = `arrowhead-${safeColor}`;

  // 이미 해당 색상의 마커가 있다면 ID만 반환
  if (document.getElementById(markerId)) return markerId;

  // 없다면 새로 생성
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "10");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
  polygon.setAttribute("fill", color); // 선과 같은 색으로 채우기

  marker.appendChild(polygon);
  defs.appendChild(marker);

  return markerId;
}

// 🔹 [수정] 관계선 색상 변경 함수
function changeRelationColor(relation) {
  const newColor = prompt("원하는 색상(코드)을 입력하세요 (예: #ff0000, blue):", "#555");
  if (newColor) {
    // 1. 선 색상 변경
    relation.line.style.stroke = newColor;
    // 2. 글자 색상 변경
    relation.text.style.fill = newColor;
    // 3. 해당 색상의 마커를 가져오거나 생성하여 적용
    const markerId = getOrCreateMarker(newColor);
    relation.line.setAttribute("marker-end", `url(#${markerId})`);
  }
}
// 🔹 관계도를 PNG 이미지로 저장하는 함수
function saveAsImage() {
  const canvasElement = document.getElementById("canvas");

  // html2canvas를 이용해 캡처
  html2canvas(canvasElement, {
    backgroundColor: "#f5f5f5", // 배경색 지정
    useCORS: true,              // 외부 리소스 허용
    scale: 2                    // 고화질 저장을 위해 해상도 2배
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "인물관계도.png"; // 파일 이름
    link.href = canvas.toDataURL("image/png");
    link.click(); // 다운로드 실행
  });
}
function saveAsImage() {
  const canvas = document.getElementById("canvas");
  
  // 저장 중임을 알리는 표시 (선택사항)
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.innerText = "저장 중...";
  saveBtn.disabled = true;

  // html2canvas 옵션 설정
  html2canvas(canvas, {
    backgroundColor: "#f5f5f5", // 배경색 강제 지정
    scale: 2,                   // 2배 해상도로 선명하게 저장
    useCORS: true,              // 외부 이미지 허용 (필요 시)
    logging: false              // 콘솔 로그 끄기
  }).then(generatedCanvas => {
    // 이미지를 다운로드 링크로 변환
    const link = document.createElement("a");
    link.download = "my-relationship-map.png";
    link.href = generatedCanvas.toDataURL("image/png");
    link.click();

    // 버튼 상태 복구
    saveBtn.innerText = "관계도 저장 (PNG)";
    saveBtn.disabled = false;
  }).catch(err => {
    console.error("저장 실패:", err);
    alert("이미지 저장 중 오류가 발생했습니다.");
    saveBtn.innerText = "관계도 저장 (PNG)";
    saveBtn.disabled = false;
  });
}
// 🔹 1. 데이터 저장 함수 (파일 다운로드)
function saveData() {
  // 저장에 필요한 최소한의 데이터만 추출
  const data = {
    people: people.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      left: p.element.style.left,
      top: p.element.style.top
    })),
    relations: relations.map(r => ({
      from: r.from,
      to: r.to,
      color: r.line.style.stroke,
      text: r.text.textContent
    })),
    lastId: personId
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relationship_data.json";
  link.click();
}

// 🔹 2. 데이터 불러오기 함수 (파일 읽기)
function loadData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    
    // 기존 화면 초기화
    document.getElementById("canvas").innerHTML = '<svg id="lines"><defs></defs></svg>';
    people.length = 0;
    relations.length = 0;

    // 인물 복구
    personId = data.lastId || 0;
    data.people.forEach(p => {
      recreatePerson(p);
    });

    // 관계 복구 (인물들이 다 생성된 후 진행)
    data.relations.forEach(r => {
      const p1 = people.find(p => p.id == r.from).element;
      const p2 = people.find(p => p.id == r.to).element;
      
      // 기존 createLine 로직 활용하되 데이터 입히기
      createLineWithData(p1, p2, r.color, r.text);
    });

    renderPersonList();
    updateLines();
  };
  reader.readAsText(file);
}

// 🔹 3. [보조] 저장된 데이터로 인물을 다시 그리는 함수
function recreatePerson(p) {
  const div = document.createElement("div");
  div.className = "person";
  div.textContent = p.name;
  div.dataset.id = p.id;
  div.style.background = p.color;
  div.style.left = p.left;
  div.style.top = p.top;

  // 기존 이벤트 리스너들 재연결 (중요!)
  div.addEventListener("mousedown", (e) => {
    selected = div;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    e.stopPropagation();
  });
  div.addEventListener("click", () => handleRelation(div));
  div.addEventListener("dblclick", (e) => { e.stopPropagation(); editPersonName(p.id); });
  div.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if(confirm(`'${p.name}' 인물을 삭제하시겠습니까?`)) deletePerson(p.id);
  });

  document.getElementById("canvas").appendChild(div);
  people.push({ id: p.id, name: p.name, element: div, color: p.color });
}

// 🔹 4. [보조] 저장된 데이터로 관계선을 다시 그리는 함수
function createLineWithData(p1, p2, color, textContent) {
  const svg = document.getElementById("lines");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

  line.style.stroke = color;
  text.style.fill = color;
  text.textContent = textContent;
  text.setAttribute("class", "relation-text");

  const relation = {
    id: Date.now() + Math.random(),
    from: p1.dataset.id,
    to: p2.dataset.id,
    p1, p2, line, text
  };

  // 선 이벤트 재연결
  line.addEventListener("dblclick", (e) => { e.stopPropagation(); changeRelationColor(relation); });
  line.addEventListener("contextmenu", (e) => { e.preventDefault(); if (confirm("삭제?")) deleteRelation(relation.id); });
  text.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = prompt("수정/삭제:", text.textContent);
    if (action === "삭제") deleteRelation(relation.id);
    else if (action) text.textContent = action;
  });

  svg.appendChild(line);
  svg.appendChild(text);
  relations.push(relation);
}