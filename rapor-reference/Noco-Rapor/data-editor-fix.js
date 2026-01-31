// Kampanya ekle - DÜZELTİLMİŞ VERSİYON
function addCampaign() {
  campaignCount++;
  const list = document.getElementById('campaignsList');
  const div = document.createElement('div');
  div.className = 'dynamic-item campaign';
  div.id = `campaign-${campaignCount}`;
  const currentId = campaignCount;
  
  div.innerHTML = `
    <div class="form-group">
      <label>Kampanya Adı</label>
      <input type="text" id="campaign-name-${currentId}" placeholder="Black Friday 2025">
    </div>
    <div class="form-group">
      <label>Amaç</label>
      <select id="campaign-objective-${currentId}">
        <option value="awareness">Bilinirlik</option>
        <option value="traffic">Trafik</option>
        <option value="engagement">Etkileşim</option>
        <option value="leads">Potansiyel Müşteriler</option>
        <option value="app">Uygulama Tanıtımı</option>
        <option value="sales">Satışlar</option>
        <option value="messages">Mesajlaşma</option>
      </select>
    </div>
    <div class="form-group">
      <label>Harcama (₺)</label>
      <input type="number" id="campaign-spend-${currentId}" placeholder="5000">
    </div>
    <div class="form-group">
      <label id="campaign-metric1-label-${currentId}">Birincil Metrik</label>
      <input type="number" id="campaign-metric1-${currentId}" placeholder="450000">
    </div>
    <div class="form-group">
      <label id="campaign-metric2-label-${currentId}">İkincil Metrik</label>
      <input type="number" step="0.01" id="campaign-metric2-${currentId}" placeholder="0">
    </div>
    <button class="btn btn-small btn-danger" onclick="removeItem('campaign-${currentId}')">Sil</button>
  `;
  list.appendChild(div);
  
  // Event listener ile onChange ekle
  const selectEl = document.getElementById(`campaign-objective-${currentId}`);
  selectEl.addEventListener('change', function() {
    updateCampaignLabels(currentId);
  });
  
  // Başlangıç label'larını ayarla
  updateCampaignLabels(currentId);
}

function updateCampaignLabels(id) {
  const selectEl = document.getElementById(`campaign-objective-${id}`);
  if (!selectEl) return;
  
  const objective = selectEl.value;
  const metrics = campaignMetrics[objective];
  
  const label1 = document.getElementById(`campaign-metric1-label-${id}`);
  const label2 = document.getElementById(`campaign-metric2-label-${id}`);
  
  if (label1) label1.textContent = metrics.primary;
  if (label2) label2.textContent = metrics.secondary;
}
