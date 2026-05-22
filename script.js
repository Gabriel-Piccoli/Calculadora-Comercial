
// ================== VARIÁVEIS ==================

let monthlyItems = [];
let oneTimeItems = [];

// ================== UTIL ==================
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ================== BLOQUEIO DESCONTO ==================
function validarDescontoImplantacao() {
    const select = document.getElementById('taxaAtivacao');
    const input = document.getElementById('discountSetupValue');
    const type = document.getElementById('discountSetupType');

    if (parseFloat(select.value) === 0) {
        input.value = '';
        input.disabled = true;
        type.disabled = true;
    } else {
        input.disabled = false;
        type.disabled = false;
    }
}

// ================== CALCULO ==================
function calculate() {
    monthlyItems = [];
    oneTimeItems = [];

    let monthlyTotal = 0;
    let oneTimeTotal = 0;

    const summaryList = document.getElementById('summaryList');
    summaryList.innerHTML = '';

    // ===== PLANO =====
    const selectedPlan = document.querySelector('input[name="plano"]:checked');
    if (selectedPlan) {
        const price = parseFloat(selectedPlan.value);
        const name = selectedPlan.dataset.name;

        monthlyTotal += price;
        monthlyItems.push({ name, price });
        addToSummary(name, price, false);
    }

    // ===== ADDONS =====
    document.querySelectorAll('.addon:checked').forEach(item => {
        const parent = item.closest('.form-group');
        const inputPrice = parent.querySelector('.price-input');

        let price = 0;

        if (inputPrice && inputPrice.value) {
            price = parseFloat(inputPrice.value.replace(',', '.')) || 0;
        } else {
            price = parseFloat(item.value) || 0;
        }
        const name = item.dataset.name;
        const isUnique = item.classList.contains('unique');

        if (isUnique) {
            oneTimeTotal += price;
            oneTimeItems.push({ name, price });
            addToSummary(name, price, true);
        } else {
            monthlyTotal += price;
            monthlyItems.push({ name, price });
            addToSummary(name, price, false);
        }
    });

    // ===== PDV =====
    const qtyPdv = parseInt(document.getElementById('qtyPdv').value) || 0;
    const unitPriceDisplay = document.getElementById('pdvUnitPriceDisplay');

    let priceForQuantity = 0;

    if (qtyPdv > 2) {
        priceForQuantity = (qtyPdv - 2) * 30;
    }

    if (qtyPdv > 0) {
        unitPriceDisplay.textContent = priceForQuantity === 0
            ? "Grátis"
            : `Pacote: ${formatCurrency(priceForQuantity)}`;

        const name = `Pacote de ${qtyPdv} PDV(s) Adicional(is)`;

        monthlyTotal += priceForQuantity;
        monthlyItems.push({ name, price: priceForQuantity });
        addToSummary(name, priceForQuantity, false);
    } else {
        unitPriceDisplay.textContent = "R$ 0,00";
    }

    // ===== IMPLANTAÇÃO =====
    const activationSelect = document.getElementById('taxaAtivacao');
    const activationPrice = parseFloat(activationSelect.value);
    const activationName = activationSelect.options[activationSelect.selectedIndex].dataset.name;

    if (activationName) {
        oneTimeTotal += activationPrice;
        oneTimeItems.push({ name: activationName, price: activationPrice });
        addToSummary(activationName, activationPrice, true);
    }

    // ===== DESCONTOS =====
    const discountMonthlyValue = parseFloat(
        (document.getElementById('discountMonthlyValue').value || "0").replace(',', '.')
    ) || 0;

    const discountMonthlyType = document.getElementById('discountMonthlyType').value;

    let discountMonthly = discountMonthlyType === 'percent'
        ? (monthlyTotal * discountMonthlyValue) / 100
        : discountMonthlyValue;

    const discountSetupValue = parseFloat(
        (document.getElementById('discountSetupValue').value || "0").replace(',', '.')
    ) || 0;

    const discountSetupType = document.getElementById('discountSetupType').value;

    let discountSetup = discountSetupType === 'percent'
        ? (oneTimeTotal * discountSetupValue) / 100
        : discountSetupValue;


    // DESCONTO NA MENSALIDADE
    const discountMonthlyBox = document.getElementById('discount-monthly-box');
    if (window.discountMonthly > 0) {
        discountMonthlyBox.innerHTML = `
            <span style="color:#999;">De: ${formatCurrency(window.originalMonthly)}</span><br>
            <span style="color:red;">Desconto: -${formatCurrency(window.discountMonthly)}</span>
        `;
    } else {
        discountMonthlyBox.innerHTML = '';
    }


    // DESCONTO NA IMPLANTAÇÃO
    const discountSetupBox = document.getElementById('discount-setup-box');
    if (window.discountSetup > 0) {
        discountSetupBox.innerHTML = `
            <span style="color:#999;">De: ${formatCurrency(window.originalSetup)}</span><br>
            <span style="color:red;">Desconto: -${formatCurrency(window.discountSetup)}</span>
        `;
    } else {
        discountSetupBox.innerHTML = '';
    }


    // VALORES FINAIS
    window.currentMonthly = monthlyTotal;
    window.currentOneTime = oneTimeTotal;

    // DESCONTOS
    // ===== DESCONTOS =====

    // 👉 GUARDA VALOR ORIGINAL ANTES DO DESCONTO
    const originalMonthly = monthlyTotal;
    const originalSetup = oneTimeTotal;

    // ===== MOSTRA NO RESUMO =====
    if (discountMonthly > 0) {
        addToSummary("Desconto Mensal", -discountMonthly, false);
    }

    if (discountSetup > 0) {
        addToSummary("Desconto Implantação", -discountSetup, true);
    }

    // ===== APLICA DESCONTOS =====
    monthlyTotal = Math.max(0, originalMonthly - discountMonthly);
    oneTimeTotal = Math.max(0, originalSetup - discountSetup);

    // ===== SALVA GLOBAL =====
    window.currentMonthly = monthlyTotal;
    window.currentOneTime = oneTimeTotal;

    window.discountMonthly = discountMonthly;
    window.discountSetup = discountSetup;

    window.originalMonthly = originalMonthly;
    window.originalSetup = originalSetup;

    // ===== % ECONOMIA =====
    window.percentMonthly = originalMonthly > 0
        ? (discountMonthly / originalMonthly) * 100
        : 0;

    window.percentSetup = originalSetup > 0
        ? (discountSetup / originalSetup) * 100
        : 0;


    // ===== ATUALIZA UI =====
    document.getElementById('displayMonthly').textContent = formatCurrency(monthlyTotal);
    document.getElementById('displayOneTime').textContent = formatCurrency(oneTimeTotal);
    document.getElementById('totalDisplay').textContent = formatCurrency(monthlyTotal + oneTimeTotal);

    window.currentMonthly = monthlyTotal;
    window.currentOneTime = oneTimeTotal;

    // 👇 GARANTE BLOQUEIO SEMPRE CORRETO
    validarDescontoImplantacao();
}

// ================== SUMMARY ==================
function addToSummary(name, price, isUnique) {
    const li = document.createElement('li');
    const color = isUnique ? '#999' : 'var(--primary)';
    const displayPrice = price === 0 ? 'Grátis' : formatCurrency(price);

    li.innerHTML = `
        <span>${name}</span>
        <span style="color:${color}; font-weight:bold;">${displayPrice}</span>
    `;

    document.getElementById('summaryList').appendChild(li);
}

function generateProposal() {
    if (monthlyItems.length === 0 && oneTimeItems.length === 0) {
        alert('⚠️ Selecione itens para gerar a proposta!');
        return;
    }

    const clientName = document.getElementById('clientName').value || 'Cliente';
    const clientEmpresa = document.getElementById('clientEmpresa').value || 'Empresa';
    const consultantName = document.getElementById('consultantName').value || 'Consultor';
    const consultantEmail = document.getElementById('consultantEmail').value || 'Email';

    // ===== DADOS =====
    document.getElementById('prop-client').textContent = clientName;
    document.getElementById('prop-clientEmpresa').textContent = clientEmpresa;
    document.getElementById('prop-consultant').textContent = consultantName;
    document.getElementById('card-consultant-email').textContent = consultantEmail;

    const today = new Date();
    document.getElementById('prop-date').textContent = today.toLocaleDateString('pt-BR');

    // ===== LISTAS =====
    const listMonthly = document.getElementById('prop-monthly-list');
    const listOneTime = document.getElementById('prop-onetime-list');

    listMonthly.innerHTML = '';
    listOneTime.innerHTML = '';

    monthlyItems.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.name}</span><span>${formatCurrency(item.price)}</span>`;
        listMonthly.appendChild(li);
    });

    oneTimeItems.forEach(item => {
        const li = document.createElement('li');
        const priceText = item.price === 0 ? 'Isento' : formatCurrency(item.price);
        li.innerHTML = `<span>${item.name}</span><span>${priceText}</span>`;
        listOneTime.appendChild(li);
    });

    // ===== VISIBILIDADE =====
    const activationBox = document.getElementById('activation-box');
    activationBox.style.display = oneTimeItems.length > 0 ? 'block' : 'none';

    // ===== TOTAIS =====
    document.getElementById('prop-total-monthly').textContent = formatCurrency(window.currentMonthly);
    document.getElementById('prop-total-activation').textContent = formatCurrency(window.currentMonthly + window.currentOneTime);
    document.getElementById('prop-repeat-val').textContent = formatCurrency(window.currentMonthly);

    // ===== CONSULTOR (INICIAIS) =====
    const initials = consultantName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    document.getElementById('consultant-initials').textContent = initials;
    document.getElementById('card-consultant-name').textContent = consultantName;

    // ===== DESCONTO MENSAL (VISUAL) =====
    const discountMonthlyBox = document.getElementById('discount-monthly-box');

    if (window.discountMonthly > 0) {
        discountMonthlyBox.innerHTML = `
        <div style="text-decoration:line-through; color:#999;">
            De ${formatCurrency(window.originalMonthly)}
        </div>

        <div style="font-size:18px; font-weight:bold; color:var(--primary);">
            Por ${formatCurrency(window.currentMonthly)}
        </div>

        <div style="margin-top:5px;">
            💰 <strong>Você economiza ${formatCurrency(window.discountMonthly)} (${window.percentMonthly.toFixed(0)}%)</strong>
        </div>
    `;
    } else {
        discountMonthlyBox.innerHTML = '';
    }

    // ===== DESCONTO IMPLANTAÇÃO =====
    const discountSetupBox = document.getElementById('discount-setup-box');

    if (window.discountSetup > 0) {
        discountSetupBox.innerHTML = `
        <div style="text-decoration:line-through; color:#999;">
            De ${formatCurrency(window.originalSetup)}
        </div>

        <div style="font-size:16px; font-weight:bold;">
            Por ${formatCurrency(window.currentOneTime)}
        </div>

        <div style="margin-top:5px;">
            💰 <strong>Economia de ${formatCurrency(window.discountSetup)} (${window.percentSetup.toFixed(0)}%)</strong>
        </div>
    `;
    } else {
        discountSetupBox.innerHTML = '';
    }

    const activationSelect = document.getElementById('taxaAtivacao');
    const treinamentoItem = document.getElementById('item-treinamento');

    if (parseFloat(activationSelect.value) === 0) {
        treinamentoItem.style.display = 'none';
    } else {
        treinamentoItem.style.display = 'list-item';
    }

    // ===== PRINT =====
    setTimeout(() => {
        window.print();
    }, 200);
}



// ================== EVENTOS ==================

// checkbox automático ao digitar
document.querySelectorAll('.price-input').forEach(input => {
    input.addEventListener('input', function () {
        const parent = this.closest('.form-group');
        const checkbox = parent.querySelector('.addon');

        const valor = this.value.replace(',', '.');

        checkbox.checked = parseFloat(valor) > 0;
        calculate();
    });
});


// recalcular geral
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', calculate);
    el.addEventListener('input', calculate);
});

// ================== INIT ==================
calculate();
