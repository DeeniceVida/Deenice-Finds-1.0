
(async function(){
  const res = await fetch('data/compare.json');
  const data = await res.json();
  const s1 = document.getElementById('c1');
  const s2 = document.getElementById('c2');
  const s3 = document.getElementById('c3');
  [s1,s2,s3].forEach(s=>{
    const empty = document.createElement('option'); empty.value=''; empty.textContent='-- Select phone --'; s.appendChild(empty);
    data.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.title; s.appendChild(o); });
  });
  document.getElementById('do-compare').addEventListener('click', ()=>{
    const ids = [s1.value,s2.value,s3.value].filter(Boolean);
    render(ids);
  });
  function render(ids){
    const items = data.filter(d=>ids.includes(d.id));
    if(items.length===0){ document.getElementById('compare-table').innerHTML='<p>Select phones to compare.</p>'; return; }
    const keys = ['Display','OS','Chipset','RAM','Storage','Main camera','Battery','Price'];
    let html = '<table style="width:100%;border-collapse:collapse"><thead><tr><th></th>';
    items.forEach(it=> html += `<th style="text-align:left;padding:10px">${it.title}<br><img src="${it.image}" style="width:120px;border-radius:8px;margin-top:8px"/></th>`);
    html += '</tr></thead><tbody>';
    keys.forEach(k=>{
      html += `<tr style="border-top:1px solid rgba(0,0,0,0.04)"><td style="padding:10px;font-weight:600">${k}</td>`;
      items.forEach(it=> html += `<td style="padding:10px">${it.specs[k]||'—'}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('compare-table').innerHTML = html;
  }
})();
