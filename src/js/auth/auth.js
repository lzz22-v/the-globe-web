// =========================================
// IMPORTAÇÃO DO SUPABASE
// =========================================
import { supabase } from '../config/supabase.js';

// =========================================
// SELETORES DE INTERFACE
// =========================================
const registerContainer = document.getElementById('register-container');
const loginContainer = document.getElementById('login-container');
const linkToLogin = document.getElementById('link-to-login');
const linkToRegister = document.getElementById('link-to-register');
const brandSubtitle = document.getElementById('brand-subtitle');

// Seletores de Formulários e Botões
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const btnRegister = document.getElementById('btn-register');
const btnLogin = document.getElementById('btn-login');
const btnGoogleRegister = document.getElementById('btn-google-register');
const btnGoogleLogin = document.getElementById('btn-google-login');

// =========================================
// TEXTOS DINÂMICOS
// =========================================
const textRegister = `Junte-se à comunidade. Crie personagens,<br>
                      entre em salas e co-escreva histórias<br>
                      inesquecíveis.`;

const textLogin = `O palco digital para histórias colaborativas.<br>
                   Roleplay, exibição e convivência — tudo em um<br>
                   só lugar.`;

// =========================================
// FUNÇÕES DE ALTERNÂNCIA DE TELA
// =========================================

function showLogin(e) {
    if (e) e.preventDefault();

    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');

    brandSubtitle.innerHTML = textLogin;
}

function showRegister(e) {
    if (e) e.preventDefault();

    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');

    brandSubtitle.innerHTML = textRegister;
}

// =========================================
// LÓGICA DO OLHO (REVELAR/OCULTAR SENHA)
// =========================================

function initPasswordToggle() {
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');
            const isPassword = input.getAttribute('type') === 'password';

            input.setAttribute('type', isPassword ? 'text' : 'password');
            wrapper.classList.toggle('visible', isPassword);
        });
    });
}

// =========================================
// UTILITÁRIOS
// =========================================

// Evita cliques duplos enquanto a requisição está em andamento
function setLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.style.opacity = isLoading ? '0.7' : '';
}

// Funciona tanto no site publicado quanto em testes locais.
// Lembre de incluir cada origem em additional_redirect_urls no config.toml
const PROFILE_URL = `${window.location.origin}/profile.html`;

// =========================================
// LÓGICA DE AUTENTICAÇÃO (SUPABASE)
// =========================================

// 1. Cadastro via E-mail e Senha
async function handleEmailRegister(e) {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password.length < 8) {
        alert("A senha precisa ter no mínimo 8 caracteres.");
        return;
    }

    if (password !== confirmPassword) {
        alert("As senhas não coincidem. Tente novamente.");
        return;
    }

    setLoading(btnRegister, true);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name // Salva o nome no mesmo local que o Google salvaria
                }
            }
        });

        if (error) throw error;

        // Se a confirmação por e-mail estiver ativa, não há sessão ainda
        if (!data.session) {
            alert("Conta criada! Confirme seu e-mail para entrar.");
            showLogin();
            return;
        }

        window.location.href = 'profile.html';

    } catch (error) {
        console.error("Erro no cadastro:", error.message);
        alert("Erro ao criar conta: " + error.message);
    } finally {
        setLoading(btnRegister, false);
    }
}

// 2. Login via E-mail e Senha
async function handleEmailLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setLoading(btnLogin, true);

    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;

        window.location.href = 'profile.html';

    } catch (error) {
        console.error("Erro no login:", error.message);
        alert("E-mail ou senha incorretos.");
    } finally {
        setLoading(btnLogin, false);
    }
}

// 3. Autenticação via Google (Serve tanto para Login quanto para Cadastro)
async function handleGoogleAuth() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: PROFILE_URL,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;

    } catch (error) {
        console.error("Erro na autenticação com Google:", error.message);
        alert("Não foi possível conectar com o Google.");
    }
}

// =========================================
// EVENT LISTENERS E INICIALIZAÇÃO
// =========================================

// Navegação UI
linkToLogin.addEventListener('click', showLogin);
linkToRegister.addEventListener('click', showRegister);

// Formulários de Autenticação
registerForm.addEventListener('submit', handleEmailRegister);
loginForm.addEventListener('submit', handleEmailLogin);

// Botões do Google
btnGoogleRegister.addEventListener('click', handleGoogleAuth);
btnGoogleLogin.addEventListener('click', handleGoogleAuth);

// Inicializa os botões de olho
initPasswordToggle();

// Quem já está logado vai direto para o perfil
supabase.auth.getSession().then(({ data }) => {
    if (data.session) window.location.replace('profile.html');
});