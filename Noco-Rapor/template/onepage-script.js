// Data placeholder
window.__REPORT_DATA__ = null;

// FALLBACK DATA
window.__FALLBACK_DATA__ = {
  "brand": {"name": "Zoks Stuido", "period": "1 Eylul - 1 Kasim | 2025"},
  "summary": {"followers": 18834, "followers_change": 2.6, "reach": 96450, "reach_change": -35.2, "impressions": 399764, "impressions_ads_percent": 30.4, "engagement_change": 0},
  "profile_actions": {"profile_visits": 9919, "external_link_taps": 769, "address_taps": 100},
  "content_mix": [
    {"name": "Reels", "percent": 84},
    {"name": "Hikaye", "percent": 8},
    {"name": "Tasarim", "percent": 6}
  ],
  "growth_trend": {
    "reach": [
      {"period": "Eylul - Ekim", "value": 140649},
      {"period": "Ekim - Kasim", "value": 96459}
    ]
  },
  "top_contents": [
    {"title": "Ayyuzlum Tanitim", "type": "Tasarim", "reach": 16889, "eng": 49, "rate": 0.3},
    {"title": "Ayyuzlum Kacis", "type": "Reel", "reach": 9113, "eng": 307, "rate": 3.4},
    {"title": "Fingersnap", "type": "Reel", "reach": 5695, "eng": 182, "rate": 3.2}
  ],
  "campaigns": [
    {"name": "Yeni Is Ilani", "objective": "messages", "spend": 625, "metric1": {"label": "Mesaj", "value": 11.608}, "metric2": {"label": "Mesaj Basi Maliyet (TL)", "value": 170}},
    {"name": "Profil Yonlendirme", "objective": "traffic", "spend": 3313, "metric1": {"label": "Tiklama", "value": 4453}, "metric2": {"label": "CPC (TL)", "value": 0.74}},
    {"name": "Workshop Mesajlasma", "objective": "messages", "spend": 3286, "metric1": {"label": "Mesaj", "value": 181}, "metric2": {"label": "Mesaj Basi Maliyet (TL)", "value": 18.16}},
    {"name": "Urunler | Katalog", "objective": "messages", "spend": 39, "metric1": {"label": "Mesaj", "value": 0}, "metric2": {"label": "Mesaj Basi Maliyet (TL)", "value": 0}}
  ],
  "strategies": [
    "Cekimler Yapilirken, urunlere ve workshop'a odakli yapildi.",
    "Devam edildigi takdirde, Store'a yonlendirmeli",
    "aciklama yazimlari ve kurguda goruntu ekleme seklinde",
    "satisa donmesi icin planlama yapilacak."
  ],
  "recommendations": [
    "Online Satis Kanallarinin acilmasi.",
    "Dukkandan ve Ozellikle Workshop gunleri",
    "Studio kismindan bolca story paylasimi."
  ],
  "deliverables": {
    "reels": [
      "5 Ekim | Stoness serisi Zoks'ta",
      "11 Ekim | Finger Snap",
      "13 Ekim | Zoks Halloween Koleksiyonu",
      "17 Ekim | Workshoplar Devam Ediyor",
      "21 Ekim | Ayyüzlüm Kaçış",
      "2 Kasım | Taş Kağıt Makas Zoks"
    ],
    "designs": [
      "Kasım Workshop",
      "Workshop Devam Ediyor Afişi",
      "İş İlanı Tasarımı",
      "Katalog Fotoğraf Çekimi",
      "Ayyüzlüm Tanıtım"
    ]
  },
  "service_fee": {"amount": 40000, "currency": "TRY"},
  "bank_info": {"account_name": "NOCO CREATIVE DIGITAL STUDIOS", "bank_name": "Garanti BBVA", "iban": "TR73 0006 2000 1400 0006 2849 86"}
};

// Campaign objective mapping
const objectiveMapping = {
  'messages': 'mesajlasma',
  'traffic': 'trafik',
  'awareness': 'bilinirlik',
  'engagement': 'etkilesim',
  'leads': 'potansiyel',
  'app_promotion': 'uygulama',
  'sales': 'satis'
};

const campaignObjectives = {
  'bilinirlik': { label: 'Bilinirlik' },
  'trafik': { label: 'Trafik' },
  'etkilesim': { label: 'Etkileşim' },
  'potansiyel': { label: 'Potansiyel Müşteri' },
  'uygulama': { label: 'Uygulama Tanıtımı' },
  'satis': { label: 'Satışlar' },
  'mesajlasma': { label: 'Mesajlaşma' }
};

// Load data: once localStorage, yoksa fallback data
function loadReportData() {
  try {
    const localData = localStorage.getItem('report_data');
    if (localData) {
      const data = JSON.parse(localData);
      window.__REPORT_DATA__ = data;
      document.getElementById('noDataScreen').style.display = 'none';
      document.getElementById('reportContainer').style.display = 'block';
      renderReport(data);
      console.log('✅ Rapor verisi localStorage dan yuklendi');
      return true;
    }
  } catch (error) {
    console.error('❌ localStorage okunamadi:', error);
  }
  
  if (window.__FALLBACK_DATA__) {
    console.log('⚠️ localStorage bos, fallback test verisi kullaniliyor');
    window.__REPORT_DATA__ = window.__FALLBACK_DATA__;
    document.getElementById('noDataScreen').style.display = 'none';
    document.getElementById('reportContainer').style.display = 'block';
    renderReport(window.__FALLBACK_DATA__);
    return true;
  }
  
  document.getElementById('noDataScreen').style.display = 'flex';
  document.getElementById('reportContainer').style.display = 'none';
  console.warn('⚠️ Rapor verisi bulunamadi.');
  return false;
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateCharts();
}

// Go to editor
function goToEditor() {
  window.location.href = '../viewer.html';
}

// Load theme preference
window.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
  loadReportData();
});

// Chart instances
let engagementChart = null;
let growthChart = null;

// Format numbers
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('tr-TR');
}

// Get chart colors
function getChartColors() {
  const isDark = document.body.classList.contains('dark');
  return {
    primary: '#329FF5',
    secondary: '#00F5B0',
    tertiary: '#F6D73C',
    quaternary: '#FF4242',
    text: isDark ? '#E9E2D0' : '#3D4D52',
    grid: isDark ? 'rgba(233, 226, 208, 0.1)' : 'rgba(61, 77, 82, 0.1)'
  };
}

// Render report
function renderReport(data) {
  if (!data) return;

  document.getElementById('brand-name').textContent = data.brand && data.brand.name || 'Marka Adi';
  document.getElementById('report-period-badge').textContent = data.brand && data.brand.period || 'Aylik Sosyal Medya Raporu';

  if (data.summary) {
    document.getElementById('kpi-followers').textContent = formatNumber(data.summary.followers || 0);
    document.getElementById('kpi-reach').textContent = formatNumber(data.summary.reach || 0);
    document.getElementById('kpi-views').textContent = formatNumber(data.summary.impressions || 0);
    
    let engagementRate = 0;
    if (data.profile_actions && data.summary.reach) {
      const totalProfileActions = (data.profile_actions.profile_visits || 0) + (data.profile_actions.external_link_taps || 0) + (data.profile_actions.address_taps || 0);
      const reach = data.summary.reach || 0;
      if (totalProfileActions > 0) {
        engagementRate = reach / totalProfileActions;
      }
    }
    document.getElementById('kpi-engagement').textContent = engagementRate.toFixed(2) + '%';
    
    const followersChange = document.getElementById('kpi-followers-change');
    const reachChange = document.getElementById('kpi-reach-change');
    const viewsChange = document.getElementById('kpi-views-change');
    const engChange = document.getElementById('kpi-engagement-change');
    
    followersChange.textContent = (data.summary.followers_change >= 0 ? '+' : '') + (data.summary.followers_change || 0) + '%';
    followersChange.classList.toggle('negative', data.summary.followers_change < 0);
    
    reachChange.textContent = (data.summary.reach_change >= 0 ? '+' : '') + (data.summary.reach_change || 0) + '%';
    reachChange.classList.toggle('negative', data.summary.reach_change < 0);
    
    viewsChange.textContent = (data.summary.impressions_change >= 0 ? '+' : '') + (data.summary.impressions_change || 0) + '%';
    viewsChange.classList.toggle('negative', data.summary.impressions_change < 0);
    
    engChange.textContent = (data.summary.engagement_change >= 0 ? '+' : '') + (data.summary.engagement_change || 0) + '%';
    engChange.classList.toggle('negative', data.summary.engagement_change < 0);
  }

  if (data.profile_actions) {
    document.getElementById('profile-visits').textContent = formatNumber(data.profile_actions.profile_visits || 0);
    document.getElementById('external-links').textContent = formatNumber(data.profile_actions.external_link_taps || 0);
    document.getElementById('address-taps').textContent = formatNumber(data.profile_actions.address_taps || 0);
  }

  const topContents = document.getElementById('topContents');
  topContents.innerHTML = '';
  if (data.top_contents) {
    data.top_contents.forEach(function(content) {
      const typeClass = (content.type || '').toLowerCase().replace('ı', 'i');
      const card = document.createElement('div');
      card.className = 'content-card';
      card.innerHTML = '<div class="content-type ' + typeClass + '">' + (content.type || 'İçerik') + '</div><div class="content-title">' + content.title + '</div><div class="content-metrics"><div class="metric"><div class="metric-label">Erişim</div><div class="metric-value">' + formatNumber(content.reach || 0) + '</div></div><div class="metric"><div class="metric-label">Etkileşim</div><div class="metric-value">' + formatNumber(content.eng || 0) + '</div></div><div class="metric"><div class="metric-label">Oran</div><div class="metric-value">' + (content.rate || 0).toFixed(1) + '%</div></div></div>';
      topContents.appendChild(card);
    });
  }

  const campaignsContainer = document.getElementById('campaignsContainer');
  campaignsContainer.innerHTML = '';
  if (data.campaigns && data.campaigns.length > 0) {
    data.campaigns.forEach(function(campaign) {
      const objectiveKey = objectiveMapping[campaign.objective] || campaign.objective || 'etkilesim';
      const objData = campaignObjectives[objectiveKey] || { label: 'Kampanya' };
      
      const card = document.createElement('div');
      card.className = 'campaign-card';
      card.innerHTML = '<div class="campaign-header"><div class="campaign-name">' + campaign.name + '</div><div class="campaign-objective">' + objData.label + '</div></div><div class="campaign-metrics"><div class="campaign-metric"><div class="campaign-metric-label">' + (campaign.metric1 && campaign.metric1.label || 'Metrik 1') + '</div><div class="campaign-metric-value">' + formatNumber(campaign.metric1 && campaign.metric1.value || 0) + '</div></div><div class="campaign-metric"><div class="campaign-metric-label">' + (campaign.metric2 && campaign.metric2.label || 'Metrik 2') + '</div><div class="campaign-metric-value">' + (campaign.metric2 && campaign.metric2.value !== undefined ? formatNumber(campaign.metric2.value) : '₺0') + '</div></div><div class="campaign-metric"><div class="campaign-metric-label">Bütçe</div><div class="campaign-metric-value">₺' + formatNumber(campaign.spend || 0) + '</div></div></div>';
      campaignsContainer.appendChild(card);
    });
  } else {
    document.getElementById('campaigns-section').style.display = 'none';
  }

  const insightsList = document.getElementById('insightsList');
  insightsList.innerHTML = '';
  if (data.strategies) {
    data.strategies.forEach(function(strategy) {
      const li = document.createElement('li');
      li.textContent = strategy;
      insightsList.appendChild(li);
    });
  }

  const actionsList = document.getElementById('actionsList');
  actionsList.innerHTML = '';
  if (data.recommendations) {
    data.recommendations.forEach(function(recommendation) {
      const li = document.createElement('li');
      li.textContent = recommendation;
      actionsList.appendChild(li);
    });
  }

  // Teslim Edilen İçerikler - Daha esnek kontrol
  const deliverablesSection = document.getElementById('deliverables-section');
  if (data.deliverables) {
    const hasReels = data.deliverables.reels && data.deliverables.reels.length > 0;
    const hasDesigns = data.deliverables.designs && data.deliverables.designs.length > 0;
    
    if (hasReels || hasDesigns) {
      deliverablesSection.style.display = 'block';
      
      const reelsList = document.getElementById('reelsList');
      reelsList.innerHTML = '';
      if (hasReels) {
        data.deliverables.reels.forEach(function(reel) {
          const li = document.createElement('li');
          li.textContent = reel;
          reelsList.appendChild(li);
        });
      } else {
        reelsList.innerHTML = '<li style="opacity: 0.5; list-style: none; padding-left: 0;">Henüz reel eklenmemiş</li>';
      }

      const designsList = document.getElementById('designsList');
      designsList.innerHTML = '';
      if (hasDesigns) {
        data.deliverables.designs.forEach(function(design) {
          const li = document.createElement('li');
          li.textContent = design;
          designsList.appendChild(li);
        });
      } else {
        designsList.innerHTML = '<li style="opacity: 0.5; list-style: none; padding-left: 0;">Henüz tasarım eklenmemiş</li>';
      }
    } else {
      deliverablesSection.style.display = 'none';
    }
  } else {
    deliverablesSection.style.display = 'none';
  }

  if (data.service_fee) {
    document.getElementById('serviceFee').textContent = 'TL' + formatNumber(data.service_fee.amount || 0);
  }

  if (data.bank_info) {
    const bankInfo = document.getElementById('bankInfo');
    const iban = data.bank_info.iban || '';
    bankInfo.innerHTML = (data.bank_info.account_name || '') + '<br>' + (data.bank_info.bank_name || '') + '<br>IBAN: <span class="iban-copy" onclick="copyIBAN(&quot;' + iban + '&quot;)" title="Kopyalamak için tıklayın">' + iban + '</span>';
  }

  initCharts(data);
}

// Initialize charts
function initCharts(data) {
  const colors = getChartColors();

  if (data.content_mix) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    if (engagementChart) engagementChart.destroy();
    
    engagementChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.content_mix.map(function(item) { return item.name; }),
        datasets: [{
          data: data.content_mix.map(function(item) { return item.percent; }),
          backgroundColor: [colors.primary, colors.secondary, colors.tertiary, colors.quaternary],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.3,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { 
              color: colors.text,
              font: { size: 10 },
              padding: 8,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        }
      }
    });
  }

  // Büyüme Trendi Grafiği - Hem Erişim hem Görüntüleme
  const ctx2 = document.getElementById('growthChart').getContext('2d');
  if (growthChart) growthChart.destroy();
  
  // Her iki veriyi de kontrol et
  const reachData = (data.growth_trend && data.growth_trend.reach) || [];
  const impressionsData = (data.growth_trend && data.growth_trend.impressions) || [];
  
  // En az bir veri varsa grafik oluştur
  if (reachData.length > 0 || impressionsData.length > 0) {
    // Tüm period'ları topla (her iki veriden de)
    const allPeriods = [];
    const periodsSet = new Set();
    
    reachData.forEach(function(item) {
      if (!periodsSet.has(item.period)) {
        periodsSet.add(item.period);
        allPeriods.push(item.period);
      }
    });
    
    impressionsData.forEach(function(item) {
      if (!periodsSet.has(item.period)) {
        periodsSet.add(item.period);
        allPeriods.push(item.period);
      }
    });
    
    // Dataset'leri hazırla
    const datasets = [];
    
    // Erişim dataseti
    if (reachData.length > 0) {
      datasets.push({
        label: 'Erişilen Hesap',
        data: allPeriods.map(function(period) {
          const found = reachData.find(function(item) { return item.period === period; });
          return found ? found.value : null;
        }),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      });
    }
    
    // Görüntüleme dataseti
    if (impressionsData.length > 0) {
      datasets.push({
        label: 'Görüntülemeler',
        data: allPeriods.map(function(period) {
          const found = impressionsData.find(function(item) { return item.period === period; });
          return found ? found.value : null;
        }),
        borderColor: colors.secondary,
        backgroundColor: colors.secondary + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: colors.secondary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      });
    }
    
    growthChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: allPeriods,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.2,
        plugins: {
          legend: { 
            display: true,
            position: 'bottom',
            labels: {
              color: colors.text,
              font: { size: 10 },
              padding: 8,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            grid: { 
              color: colors.grid,
              drawBorder: false
            },
            ticks: { 
              color: colors.text,
              font: { size: 9 }
            }
          },
          y: {
            grid: { 
              color: colors.grid,
              drawBorder: false
            },
            ticks: { 
              color: colors.text,
              font: { size: 9 },
              callback: function(value) {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                return value;
              }
            }
          }
        }
      }
    });
  }
}

// Update charts on theme change
function updateCharts() {
  if (window.__REPORT_DATA__) {
    initCharts(window.__REPORT_DATA__);
  }
}

// Export functions
function exportAsHTML() {
  // Toolbar'ı gizle
  const toolbar = document.querySelector('.toolbar');
  const originalToolbarDisplay = toolbar ? toolbar.style.display : '';
  if (toolbar) {
    toolbar.style.display = 'none';
  }
  
  convertChartsToImages();
  
  setTimeout(function() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const brandName = (window.__REPORT_DATA__ && window.__REPORT_DATA__.brand && window.__REPORT_DATA__.brand.name || 'Rapor').replace(/\s+/g, '-');
    const date = new Date().toISOString().split('T')[0];
    a.download = brandName + '-Rapor-' + date + '.html';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Toolbar'ı geri göster
    if (toolbar) {
      toolbar.style.display = originalToolbarDisplay;
    }
    
    setTimeout(function() {
      restoreCharts();
    }, 100);
    
    console.log('✅ HTML raporu indirildi');
  }, 300);
}

// Canvas chartlari base64 imagelere cevir
function convertChartsToImages() {
  const chartCanvases = document.querySelectorAll('.chart-canvas');
  
  chartCanvases.forEach(function(canvas) {
    if (canvas.tagName === 'CANVAS') {
      const imageData = canvas.toDataURL('image/png');
      
      const img = document.createElement('img');
      img.src = imageData;
      img.className = canvas.className;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.setAttribute('data-original-canvas', 'true');
      
      canvas.parentNode.replaceChild(img, canvas);
    }
  });
}

// Chartlari geri yukle (export sonrasi)
function restoreCharts() {
  if (window.__REPORT_DATA__) {
    initCharts(window.__REPORT_DATA__);
  }
}

function exportAsPDF() {
  window.print();
}

// CSV Export fonksiyonu
function exportCSV() {
  const data = window.__REPORT_DATA__;
  
  if (!data) {
    alert('⚠️ Rapor verisi bulunamadı!');
    return;
  }
  
  let csvContent = '';
  
  // Başlık
  csvContent += '=== SOSYAL MEDYA RAPORU ===\n';
  csvContent += 'Marka,' + (data.brand.name || '') + '\n';
  csvContent += 'Dönem,' + (data.brand.period || '') + '\n';
  csvContent += '\n';
  
  // Özet Metrikler
  csvContent += '=== ÖZET METRİKLER ===\n';
  csvContent += 'Metrik,Değer,Değişim (%)\n';
  csvContent += 'Takipçi,' + (data.summary.followers || 0) + ',' + (data.summary.followers_change || 0) + '%\n';
  csvContent += 'Erişilen Hesap,' + (data.summary.reach || 0) + ',' + (data.summary.reach_change || 0) + '%\n';
  csvContent += 'Görüntülemeler,' + (data.summary.impressions || 0) + ',' + (data.summary.impressions_change || data.summary.impressions_ads_percent || 0) + '%\n';
  
  // Etkileşim oranını hesapla
  let engagementRate = 0;
  if (data.profile_actions && data.summary.reach) {
    const totalProfileActions = (data.profile_actions.profile_visits || 0) + (data.profile_actions.external_link_taps || 0) + (data.profile_actions.address_taps || 0);
    const reach = data.summary.reach || 0;
    if (totalProfileActions > 0) {
      engagementRate = (reach / totalProfileActions);
    }
  }
  csvContent += 'Etkileşim Oranı,' + engagementRate.toFixed(2) + '%,' + (data.summary.engagement_change || 0) + '%\n';
  
  if (data.summary.impressions_ads_percent) {
    csvContent += '% Reklamdan,' + data.summary.impressions_ads_percent + '%\n';
  }
  csvContent += '\n';
  
  // Profil Hareketleri
  if (data.profile_actions) {
    csvContent += '=== PROFİL HAREKETLERİ ===\n';
    csvContent += 'Metrik,Değer\n';
    csvContent += 'Profil Ziyaretleri,' + (data.profile_actions.profile_visits || 0) + '\n';
    csvContent += 'Harici Bağlantılara Dokunmalar,' + (data.profile_actions.external_link_taps || 0) + '\n';
    csvContent += 'İş Adresine Dokunmalar,' + (data.profile_actions.address_taps || 0) + '\n';
    csvContent += '\n';
  }
  
  // İçerik Dağılımı
  if (data.content_mix && data.content_mix.length > 0) {
    csvContent += '=== İÇERİK DAĞILIMI ===\n';
    csvContent += 'İçerik Tipi,Yüzde (%)\n';
    data.content_mix.forEach(function(item) {
      csvContent += item.name + ',' + item.percent + '%\n';
    });
    csvContent += '\n';
  }
  
  // Büyüme Trendi - Erişim
  if (data.growth_trend && data.growth_trend.reach && data.growth_trend.reach.length > 0) {
    csvContent += '=== BÜYÜME TRENDİ - ERİŞİLEN HESAP ===\n';
    csvContent += 'Dönem,Erişilen Hesap\n';
    data.growth_trend.reach.forEach(function(item) {
      csvContent += item.period + ',' + item.value + '\n';
    });
    csvContent += '\n';
  }
  
  // Büyüme Trendi - Görüntüleme
  if (data.growth_trend && data.growth_trend.impressions && data.growth_trend.impressions.length > 0) {
    csvContent += '=== BÜYÜME TRENDİ - GÖRÜNTÜLEMELER ===\n';
    csvContent += 'Dönem,Görüntüleme\n';
    data.growth_trend.impressions.forEach(function(item) {
      csvContent += item.period + ',' + item.value + '\n';
    });
    csvContent += '\n';
  }
  
  // En İyi İçerikler
  if (data.top_contents && data.top_contents.length > 0) {
    csvContent += '=== EN İYİ İÇERİKLER ===\n';
    csvContent += 'Başlık,Tür,Erişim,Etkileşim,Oran (%)\n';
    data.top_contents.forEach(function(content) {
      csvContent += '"' + content.title + '",' + content.type + ',' + content.reach + ',' + content.eng + ',' + content.rate + '%\n';
    });
    csvContent += '\n';
  }
  
  // Kampanyalar
  if (data.campaigns && data.campaigns.length > 0) {
    csvContent += '=== KAMPANYALAR ===\n';
    csvContent += 'Kampanya Adı,Amaç,Bütçe (₺),Metrik 1,Metrik 1 Değer,Metrik 2,Metrik 2 Değer\n';
    data.campaigns.forEach(function(campaign) {
      const objectiveKey = objectiveMapping[campaign.objective] || campaign.objective || 'etkilesim';
      const objData = campaignObjectives[objectiveKey] || { label: 'Kampanya' };
      
      csvContent += '"' + campaign.name + '",' + objData.label + ',' + campaign.spend + ',';
      csvContent += '"' + (campaign.metric1 && campaign.metric1.label || '') + '",' + (campaign.metric1 && campaign.metric1.value || 0) + ',';
      csvContent += '"' + (campaign.metric2 && campaign.metric2.label || '') + '",' + (campaign.metric2 && campaign.metric2.value || 0) + '\n';
    });
    csvContent += '\n';
  }
  
  // Stratejiler
  if (data.strategies && data.strategies.length > 0) {
    csvContent += '=== STRATEJİLER ===\n';
    data.strategies.forEach(function(strategy) {
      csvContent += '"' + strategy + '"\n';
    });
    csvContent += '\n';
  }
  
  // Öneriler
  if (data.recommendations && data.recommendations.length > 0) {
    csvContent += '=== ÖNERİLER ===\n';
    data.recommendations.forEach(function(rec) {
      csvContent += '"' + rec + '"\n';
    });
    csvContent += '\n';
  }
  
  // Teslim Edilen İçerikler - Reels
  if (data.deliverables && data.deliverables.reels && data.deliverables.reels.length > 0) {
    csvContent += '=== PAYLAŞILAN REELS ===\n';
    data.deliverables.reels.forEach(function(reel) {
      csvContent += '"' + reel + '"\n';
    });
    csvContent += '\n';
  }
  
  // Teslim Edilen İçerikler - Tasarımlar
  if (data.deliverables && data.deliverables.designs && data.deliverables.designs.length > 0) {
    csvContent += '=== YAPILAN TASARIMLAR ===\n';
    data.deliverables.designs.forEach(function(design) {
      csvContent += '"' + design + '"\n';
    });
    csvContent += '\n';
  }
  
  // Hizmet Bedeli
  csvContent += '=== HİZMET BEDELİ ===\n';
  csvContent += 'Tutar,' + (data.service_fee.amount || 0) + ' ' + (data.service_fee.currency || 'TRY') + '\n';
  csvContent += '\n';
  
  // Banka Bilgileri
  if (data.bank_info) {
    csvContent += '=== BANKA BİLGİLERİ ===\n';
    csvContent += 'Hesap Adı,' + (data.bank_info.account_name || '') + '\n';
    csvContent += 'Banka,' + (data.bank_info.bank_name || '') + '\n';
    csvContent += 'IBAN,' + (data.bank_info.iban || '') + '\n';
  }
  
  // CSV dosyasını indir
  const blob = new Blob(["\ufeff" + csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const brandName = (data.brand.name || 'Rapor').replace(/\s+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  a.download = brandName + '-Rapor-' + date + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('✅ CSV dosyası indirildi');
}

// IBAN kopyalama fonksiyonu
function copyIBAN(iban) {
  navigator.clipboard.writeText(iban).then(function() {
    alert('✅ IBAN kopyalandı: ' + iban);
  }).catch(function(err) {
    console.error('Kopyalama hatası:', err);
    alert('❌ IBAN kopyalanamadı. Lütfen manuel olarak kopyalayın.');
  });
}
