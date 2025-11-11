document.addEventListener('DOMContentLoaded', function() {
    initPhoneInput();
    initFormSubmission();
    updateFooterYear();
});

// --- CONFIGURAÇÃO DOS WEBHOOKS ---
const WEBHOOK_URL_1 = 'https://n8neditor.arck1pro.shop/webhook-test/crmexterior'; // Webhook Principal
const WEBHOOK_URL_2 = 'SUA_SEGUNDA_URL_DO_N8N_AQUI'; // Webhook Secundário (opcional)

// --- 1. FUNÇÃO DE ROLAGEM AO TOPO ---
function scrollToHero() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 2. INPUT DE TELEFONE INTERNACIONAL ---
let iti;
function initPhoneInput() {
    const input = document.querySelector("#whatsapp");
    if (input && window.intlTelInput) {
        iti = window.intlTelInput(input, {
            initialCountry: "auto",
            preferredCountries: ['us', 'br', 'pt', 'es', 'it', 'gb'],
            geoIpLookup: callback => {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("us"));
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

    // Função para capturar todas as UTMs da URL
    const getUtms = () => {
        const utms = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        // Lista de UTMs padrão para garantir que existam mesmo se vazias (opcional, mas recomendado)
        const standardUtms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        
        standardUtms.forEach(key => {
            utms[key] = urlParams.get(key) || ''; // Retorna vazio se não achar na URL
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

        // Monta o objeto de dados (JSON) que será enviado
        const formData = {
            // Dados do Lead
            nome: form.nome.value,
            email: form.email.value,
            whatsapp: iti ? iti.getNumber() : form.whatsapp.value,
            estado: form.estado.value,
            profissao: form.profissao.value,
            valor_investimento: form.valor_investimento.value,
            
            // Dados de Rastreamento
            origem: 'LP Investidor Global', // Origem fixa interna
            ...getUtms() // ESPALHA AS UTMS AQUI (SEM AGRUPAR)
        };

        try {
            // 1. Envio Principal (CRM/N8N)
            const response1 = await fetch(WEBHOOK_URL_1, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response1.status === 409) {
                alert('Seus dados já constam em nossa base. Entraremos em contato em breve.');
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
                return;
            } else if (!response1.ok) {
                throw new Error('Erro no servidor principal');
            }

            // 2. Envio Secundário (se configurado)
            if (WEBHOOK_URL_2 && WEBHOOK_URL_2 !== 'SUA_SEGUNDA_URL_DO_N8N_AQUI') {
                try {
                    await fetch(WEBHOOK_URL_2, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                } catch (error2) {
                    console.warn('Webhook secundário falhou, mas seguimos.', error2);
                }
            }

            // SUCESSO - Evento Pixel e Redirecionamento
            if (typeof fbq === 'function') fbq('track', 'Lead');
            window.location.href = 'obrigado.html';

        } catch (error) {
            console.error('Erro fatal:', error);
            alert('Ocorreu um erro técnico. Por favor, tente novamente.');
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
