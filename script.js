
const SPOONACULAR_API_KEY = "0489c2ed180a48b5adc63d940b1baf47";
const ingredientInput = document.getElementById('ingredientInput');
const mandatoryInput = document.getElementById('mandatoryInput');
const voiceBtn = document.getElementById('voiceBtn');
const addBtn = document.getElementById('addBtn');
const findBtn = document.getElementById('findBtn');
const pantryListEl = document.getElementById('pantryList');
const recipesEl = document.getElementById('recipes');
const loadingEl = document.getElementById('loading');
const shoppingListEl = document.getElementById('shoppingList');
const copyShoppingBtn = document.getElementById('copyShopping');
const downloadShoppingBtn = document.getElementById('downloadShopping');
const clearShoppingBtn = document.getElementById('clearShopping');
const savedEl = document.getElementById('saved');
const savePantryBtn = document.getElementById('savePantry');
const clearPantryBtn = document.getElementById('clearPantry');

localStorage.removeItem('sg_pantry');  // This clears pantry storage

let pantry = [];
let savedRecipes = JSON.parse(localStorage.getItem('sg_saved') || '[]');
let shoppingList = JSON.parse(localStorage.getItem('sg_shopping') || '[]');

function saveLocal(){ 
  
  localStorage.setItem('sg_saved', JSON.stringify(savedRecipes)); 
  localStorage.setItem('sg_shopping', JSON.stringify(shoppingList)); }

/* Renderers */
function renderPantry(){
  pantryListEl.innerHTML = '';
  if (!pantry.length) { pantryListEl.innerHTML = '<div class="muted">Pantry empty — add ingredients</div>'; return; }
  pantry.forEach((it, idx) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `<span>${it}</span><button data-idx="${idx}">✕</button>`;
    pantryListEl.appendChild(chip);
    chip.querySelector('button').addEventListener('click', ()=>{ pantry.splice(idx,1); saveLocal(); renderPantry(); });
  });
}

function renderSaved() {
  savedEl.innerHTML = '';
  if (!savedRecipes.length) {
    savedEl.innerHTML = 'No saved recipes yet.';
    return;
  }
  
  savedEl.innerHTML = savedRecipes.map((r, idx) => `
    <div style="margin-bottom:8px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <b>${r.title}</b>
        <div class="muted">${r.ingredients.slice(0, 4).join(', ')}${r.ingredients.length > 4 ? ', ...' : ''}</div>
      </div>
      <button data-idx="${idx}" class="delete-btn" style="background: none; border: none; cursor: pointer;">
        <img src="bin_484611.png" alt="Delete" style="width: 20px; height: 20px;"/>
      </button>
    </div>
  `).join('');

  // Add event listeners for delete buttons
  savedEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.idx);
      if (confirm('Are you sure you want to delete this recipe?')) {
        savedRecipes.splice(index, 1); // Remove the recipe from the array
        saveLocal(); // Update local storage
        renderSaved(); // Re-render the saved recipes
      }
    });
  });
}

function renderShopping(){ if (!shoppingList.length){ shoppingListEl.innerHTML = '<div class="muted">No items yet.</div>'; return; } shoppingListEl.innerHTML = shoppingList.map((s,i)=>`<div style="display:flex;justify-content:space-between;align-items:center"><div>${s}</div><button data-i="${i}" class="btn small ghost">Remove</button></div>`).join(''); shoppingListEl.querySelectorAll('button[data-i]').forEach(btn=>btn.addEventListener('click', ()=>{ shoppingList.splice(Number(btn.dataset.i),1); saveLocal(); renderShopping(); })); }

/* Add ingredient(s) */
function addIngredientsFromText(txt){
  const parts = txt.split(/\s*,\s*|\s+and\s+|\s+&\s+/i).map(p=>p.trim()).filter(Boolean);
  let added = 0;
  parts.forEach(p=>{
    const cleaned = p.replace(/^\d+\s*/, '').trim().toLowerCase();
    if (!pantry.includes(cleaned)){
      pantry.push(cleaned);
      added++;
    }
  });
  if (added) { saveLocal(); renderPantry(); }
}

/* UI events */
addBtn.addEventListener('click', ()=>{ const t = ingredientInput.value.trim(); if (!t) return; addIngredientsFromText(t); ingredientInput.value = ''; });
savePantryBtn?.addEventListener('click', ()=>{ alert('Pantry saved locally'); saveLocal(); });
clearPantryBtn?.addEventListener('click', ()=>{ if (!confirm('Clear pantry?')) return; pantry=[]; saveLocal(); renderPantry(); recipesEl.innerHTML=''; shoppingList=[]; renderShopping(); });

/* Voice input for all ingredients at once */
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    // Show recognized text briefly then add
    ingredientInput.value = text;
    addIngredientsFromText(text);
    ingredientInput.value = '';
    // speak confirmation of recognized ingredients
    speakText(`Added ingredients: ${text}`);
  };
  recognition.onerror = (e) => { console.log('voice error', e); alert('Voice error: ' + e.error); };
  recognition.onend = ()=> { voiceBtn.textContent = '🎤'; };
  voiceBtn.addEventListener('click', ()=>{ try{ recognition.start(); voiceBtn.textContent = 'Listening...'; } catch(err){ console.error(err); } });
} else { voiceBtn.disabled = true; voiceBtn.textContent = 'No Mic'; }

/* Speak helper */
let speechUtterance = null;

function speakText(txt) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  speechUtterance = new SpeechSynthesisUtterance(txt);
  speechUtterance.rate = 1;
  window.speechSynthesis.speak(speechUtterance);
}

function stopSpeaking() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  speechUtterance = null;
}

document.getElementById('recipes').addEventListener('click', (e) => {
  if (e.target.matches('button[data-action="tts"]')) {
    const idx = +e.target.dataset.idx;
    const recipe = currentRecipeList[idx]; // You need to save your currently rendered recipes here
    
    if (!recipe) return;
    
    const textToRead = recipe.steps.join('. ');
    speakText(textToRead);
  }
  else if (e.target.matches('button[data-action="stop-tts"]')) {
    stopSpeaking();
  }
});


/* shopping buttons */
copyShoppingBtn.addEventListener('click', ()=>{ if (!shoppingList.length) return alert('No items'); navigator.clipboard.writeText(shoppingList.join(', ')).then(()=> alert('Copied')); });
downloadShoppingBtn.addEventListener('click', ()=>{ if (!shoppingList.length) return alert('No items'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([shoppingList.join('\\n')],{type:'text/plain'})); a.download='shopping-list.txt'; a.click(); a.remove(); });
clearShoppingBtn.addEventListener('click', ()=>{ if (!confirm('Clear shopping list?')) return; shoppingList=[]; saveLocal(); renderShopping(); });

/* Main: fetch recipes ensuring mandatory ingredient present */
findBtn.addEventListener('click', ()=> fetchAndRenderRecipes());

async function fetchAndRenderRecipes(){
  if (!pantry.length) { alert('Add some pantry items first'); return; }
  // get mandatory ingredient from input field (user editable)
  const mand = (document.getElementById('mandatoryInput').value || '').trim().toLowerCase();
  // build ingredients array: pantry copy + mandatory if missing
  const ingredientsArr = pantry.slice();
  if (mand){
    if (!ingredientsArr.includes(mand)) ingredientsArr.push(mand);
  }
  // prepare query string for spoonacular
  const q = encodeURIComponent(ingredientsArr.join(','));
  recipesEl.innerHTML = ''; loadingEl.classList.remove('hidden');
  
    try {
    // 1) find by ingredients
    const findUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${q}&number=8&ranking=1&ignorePantry=false&apiKey=${SPOONACULAR_API_KEY}`;
    const findRes = await fetch(findUrl);
    if (!findRes.ok) throw new Error('findByIngredients failed: ' + findRes.status);
    const list = await findRes.json();
    // 2) fetch details for each
    const details = await Promise.all(list.map(r => fetch(`https://api.spoonacular.com/recipes/${r.id}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`).then(res=>res.json())));
    const recipes = details.map(d => ({
      id: d.id,
      title: d.title,
      image: d.image,
      ingredients: d.extendedIngredients ? d.extendedIngredients.map(i=>i.name) : [],
      steps: (d.analyzedInstructions && d.analyzedInstructions[0]) ? d.analyzedInstructions[0].steps.map(s=>s.step) : (d.instructions ? [d.instructions] : []),
      sourceUrl: d.sourceUrl || ''
    }));
    // Filter safety: ensure mandatory ingredient (if set) is present in ingredients list
    const finalRecipes = mand ? recipes.filter(r => r.ingredients.some(ing => ing.toLowerCase().includes(mand))) : recipes;
    renderRecipes(finalRecipes);
  } 
   catch(err){
    console.error(err);
    alert('Error fetching recipes. Check console & API key/quota.');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// /* Render recipes list */
//  function renderRecipes(list){
//   recipesEl.innerHTML = '';
//   if (!list || list.length===0) { recipesEl.innerHTML = '<div class="muted">No recipes found.</div>'; return; }
//   list.forEach((r, idx) => {
//     const missing = r.ingredients.filter(ing => !pantryIncludes(ing));
//     const card = document.createElement('div'); card.className = 'recipe-card';
//     card.innerHTML = `
//       <img class="recipe-img" src="${r.image}" alt="${r.title}" />
//       <div class="recipe-body">
//         <div style="display:flex;justify-content:space-between;align-items:flex-start">
//           <div style="min-width:0">
//             <div class="recipe-title">${r.title}</div>
//             <div class="recipe-meta">${r.ingredients.slice(0,5).join(', ')}${r.ingredients.length>5? ', ...':''}</div>
//           </div>
//           <div style="text-align:right">
//             ${ missing.length ? `<div style="color:#ef4444;font-weight:700">${missing.length} missing</div>` : `<div style="color:#10b981;font-weight:700">Ready</div>`}
//             <div style="font-size:12px;color:var(--muted)">${r.steps.length} step(s)</div>
//           </div>
//         </div>

// //         <div class="recipe-actions">
// //           <button class="btn small" data-action="toggle" data-idx="${idx}">Details</button>
// //           <button class="btn small" data-action="missing" data-idx="${idx}">Missing</button>
// //           <button class="btn small" data-action="tts" data-idx="${idx}">🔊 Read</button>
// //           <button class="btn small" data-action="save" data-idx="${idx}">Save</button>
// //           <button class="btn small" data-action="copy" data-idx="${idx}">Copy</button>
// //           <a class="btn small ghost" href="${r.sourceUrl}" target="_blank" rel="noopener">Open</a>
// //         </div>

// //         <div class="collapsible hidden" id="details-${idx}">
// //           <b>Ingredients:</b> ${r.ingredients.join(', ')}
// //           <div style="margin-top:8px"><b>Steps:</b>
// //             <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
// //           </div>
// //         </div>
// //       </div>
// //     `;
// //     recipesEl.appendChild(card);
// //   });
function renderRecipes(list) {
  recipesEl.innerHTML = '';
  if (!list || list.length === 0) {
    recipesEl.innerHTML = '<div class="muted">No recipes found.</div>';
    return;
  }
  list.forEach((r, idx) => {
    const missing = r.ingredients.filter(ing => !pantryIncludes(ing));
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <img class="recipe-img" src="${r.image}" alt="${r.title}" />
      <div class="recipe-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="min-width:0">
            <div class="recipe-title">${r.title}</div>
            <div class="recipe-meta">${r.ingredients.slice(0,5).join(', ')}${r.ingredients.length>5? ', ...':''}</div>
          </div>
          <div style="text-align:right">
            ${missing.length ? `<div style="color:#ef4444;font-weight:700">${missing.length} missing</div>` : `<div style="color:#10b981;font-weight:700">Ready</div>`}
            <div style="font-size:12px;color:var(--muted)">${r.steps.length} step(s)</div>
          </div>
        </div>

        <div class="recipe-actions">
          <button class="btn small" data-action="toggle" data-idx="${idx}">Details</button>
          <button class="btn small" data-action="missing" data-idx="${idx}">Missing</button>
          <button class="btn small" data-action="tts" data-idx="${idx}">🔊 Read</button>
          <button class="btn small" data-action="stop-tts" data-idx="${idx}">⏹ Stop</button>
          <button class="btn small" data-action="save" data-idx="${idx}">Save</button>
          <button class="btn small" data-action="copy" data-idx="${idx}">Copy</button>
          <a class="btn small ghost" href="${r.sourceUrl}" target="_blank" rel="noopener">Open</a>
        </div>

        <div class="collapsible hidden" id="details-${idx}">
          <b>Ingredients:</b> ${r.ingredients.join(', ')}
          <div style="margin-top:8px"><b>Steps:</b>
            <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
          </div>
        </div>
      </div>
    `;
    recipesEl.appendChild(card);
  });



  // handlers
  recipesEl.querySelectorAll('button[data-action]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const action = btn.dataset.action; const i = Number(btn.dataset.idx);
      const rCard = JSON.parse(JSON.stringify(list[i])); // copy
      if (action === 'toggle'){ document.getElementById(`details-${i}`).classList.toggle('hidden'); }
      else if (action === 'missing'){
        const missing = list[i].ingredients.filter(ing => !pantryIncludes(ing));
        if (!missing.length) return alert('No missing items');
        missing.forEach(m => { if (!shoppingList.includes(m)) shoppingList.push(m); });
        saveLocal(); renderShopping(); alert('Added missing items to shopping list');
      } else if (action === 'tts'){ speakSteps(list[i]); }
      else if (action === 'save'){ savedRecipes.push(list[i]); saveLocal(); renderSaved(); alert('Saved recipe'); }
      else if (action === 'copy'){ const txt = formatRecipeText(list[i]); navigator.clipboard.writeText(txt).then(()=> alert('Copied recipe')); }
    });
  });
}

/* Pantry fuzzy include */
function pantryIncludes(ingredient){
  const n = ingredient.toLowerCase();
  return pantry.some(p => { const pp = p.toLowerCase(); return pp.includes(n) || n.includes(pp); });
}

/* TTS */
function speakSteps(recipe){
  const text = recipe.steps.join('. ');
  if (!('speechSynthesis' in window)) return alert('TTS not supported in this browser');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

/* Utilities */
function formatRecipeText(r){ return `${r.title}\n\nIngredients:\n${r.ingredients.join('\n')}\n\nSteps:\n${r.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}`; }

/* init */

renderPantry(); renderSaved(); renderShopping();
recipesEl.innerHTML = '';

    saveLocal(); renderPantry(); 













