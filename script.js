document.addEventListener('DOMContentLoaded', function() {
    initPhoneInput();
    initFormSubmission();
    updateFooterYear();
});

// --- 1. FUNÇÃO DE ROLAGEM AO TOPO (HERO) ---
// Esta função é chamada pelos botões nas outras seções
function scrollToHero() {
    // Rola suavemente para o topo da página onde está o formulário
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Opcional: Focar no primeiro campo do formulário após a rolagem
    // setTimeout(() => document.getElementById('nome').focus(), 800);
}

// --- 2. INPUT DE TELEFONE INTERNACIONAL ---
let iti;
function initPhoneInput() {
    const input = document.querySelector("#whatsapp");
    if (input && window.intlTelInput) {
        iti = window.intlTelInput(input, {
            initialCountry: "auto",
            preferredCountries: ['br', 'us', 'pt', 'es', 'it', 'gb'],
            geoIpLookup: callback => {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("br"));
            },
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
            separateDialCode: true
        });
    }
}

// --- 3. ENVIO DO FORMULÁRIO ---
function initFormSubmission() {
    const form = document.getElementById('register-form');
    const submitBtn = document.getElementById('submit-button');

    if (!form || !submitBtn) return;

    // Captura UTMs
    const getUtms = () => {
        const utms = {};
        new URLSearchParams(window.location.search).forEach((value, key) => {
            if (key.startsWith('utm_')) utms[key] = value;
        });
        return utms;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (iti && !iti.isValidNumber()) {
            alert('Por favor, insira um número de WhatsApp válido.');
            document.getElementById('whatsapp').focus();
            return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'ENVIANDO...';

        const formData = {
            nome: form.nome.value,
            email: form.email.value,
            whatsapp: iti ? iti.getNumber() : form.whatsapp.value,
            profissao: form.profissao.value,
            valor_investimento: form.valor_investimento.value,
            origem: 'LP Hero Form',
            ...getUtms()
        };

        try {
            const response = await fetch('https://n8nwebhook.arck1pro.shop/webhook/lp-lead-direto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.status === 409) {
                alert('Seus dados já constam em nossa base. Entraremos em contato em breve.');
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            } else if (!response.ok) {
                throw new Error('Erro servidor');
            } else {
                if (typeof fbq === 'function') fbq('track', 'Lead');
                window.location.href = 'obrigado.html';
            }

        } catch (error) {
            console.error(error);
            alert('Erro técnico. Tente novamente em instantes.');
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}

// --- 4. UTILITÁRIO ANO RODAPÉ ---
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.innerText = new Date().getFullYear();
}