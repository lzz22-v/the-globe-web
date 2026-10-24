// =========================================
// IMPORTAÇÃO DO SUPABASE
// =========================================
// (Precisaremos criar este arquivo no próximo passo)
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
    
    loginContainer.classList.remove('hidden');
    registerContainer.classList.add('hidden');
    
    brandSubtitle.innerHTML = textRegister;
}

// =========================================
// LÓGICA DO OLHO (REVELAR/OCULTAR SENHA)
// =========================================

function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');
            
            const isPassword = input.getAttribute('type') === 'password';
            
            input.setAttribute('type', isPassword ? 'text' : 'password');
            
            if (isPassword) {
                wrapper.classList.add('visible');
            } else {
                wrapper.classList.remove('visible');
            }
        });
    });
}

// =========================================
// LÓGICA DE AUTENTICAÇÃO (SUPABASE)
// =========================================

// 1. Cadastro via E-mail e Senha
async function handleEmailRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("As senhas não coincidem. Tente novamente.");
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name // Salva o nome no mesmo local que o Google salvaria
                }
            }
        });

        if (error) throw error;
        
        // Redireciona imediatamente para o perfil após criar a conta
        window.location.href = 'profile.html';
        
    } catch (error) {
        console.error("Erro no cadastro:", error.message);
        alert("Erro ao criar conta: " + error.message);
    }
}

// 2. Login via E-mail e Senha
async function handleEmailLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Redireciona para a página de perfil
        window.location.href = 'profile.html';
        
    } catch (error) {
        console.error("Erro no login:", error.message);
        alert("E-mail ou senha incorretos.");
    }
}

// 3. Autenticação via Google (Serve tanto para Login quanto para Cadastro)
async function handleGoogleAuth() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Para onde o usuário deve voltar após autorizar no Google
                redirectTo: window.location.origin + '/profile.html',
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