// src/services/authService.js
import { authApi, bancoCentralApi } from './api';

const CPF_KEY = 'cpf';
const NOME_KEY = 'nome';
const CHAVE_PIX_KEY = 'chavePix';
const ACCOUNT_ID_KEY = 'accountId';
const USER_ID_KEY = 'userId'; // ✅ novo: usado pelo DashboardPage

const authService = {
  async login(cpf, senha) {
    try {
      console.log('🔐 Tentando login para CPF:', cpf);

      const { data } = await authApi.post('/login', {
        cpf: cpf.trim(),
        password: senha // já corrigido para "password"
      });

      console.log('✅ Login bem-sucedido, dados recebidos:', data);

      const { nome, chavePix, accountId } = data;
      if (!nome || !accountId) {
        throw new Error('Resposta de login inválida');
      }

      // 💾 Persistência no localStorage
      localStorage.setItem(CPF_KEY, cpf.trim());
      localStorage.setItem(NOME_KEY, nome);
      localStorage.setItem(CHAVE_PIX_KEY, chavePix ?? '');
      localStorage.setItem(ACCOUNT_ID_KEY, String(accountId));
      localStorage.setItem(USER_ID_KEY, String(accountId)); // ✅ adiciona também como "userId"

      console.log('💾 Dados salvos no localStorage');
      return { nome, chavePix, accountId };
    } catch (err) {
      console.error('❌ Erro no authService.login:', err.response?.data || err.message);
      throw err;
    }
  },

  logout() {
    localStorage.removeItem(CPF_KEY);
    localStorage.removeItem(NOME_KEY);
    localStorage.removeItem(CHAVE_PIX_KEY);
    localStorage.removeItem(ACCOUNT_ID_KEY);
    localStorage.removeItem(USER_ID_KEY); // ✅ garante limpeza do userId
  },

  getCpf() {
    return localStorage.getItem(CPF_KEY);
  },

  getNome() {
    return localStorage.getItem(NOME_KEY);
  },

  getChavePix() {
    return localStorage.getItem(CHAVE_PIX_KEY);
  },

  getAccountId() {
    const val = localStorage.getItem(ACCOUNT_ID_KEY);
    return val ? Number(val) : null;
  },

  // ✅ opcional útil: se o DashboardPage usa "userId"
  getUserId() {
    const val = localStorage.getItem(USER_ID_KEY);
    return val ? Number(val) : null;
  },

  async validatePix(chavePix) {
    try {
      const { data } = await bancoCentralApi.post('/pix/validate', {
        pixKey: chavePix,
        amount: 0.01
      });

      if (data.status !== 'APPROVED') {
        return { valid: false, message: data.error || 'Chave PIX inválida' };
      }

      try {
        const { data: userData } = await authApi.get(
          `/validate-pix?chavePix=${encodeURIComponent(chavePix)}`
        );
        return {
          valid: true,
          user: userData.user
        };
      } catch {
        return {
          valid: true,
          user: { nome: 'Usuário PIX', banco: 'DogBank', cpf: '' }
        };
      }
    } catch (err) {
      return {
        valid: false,
        message: err.response?.data?.error || 'Erro na validação PIX'
      };
    }
  }
};

export default authService;
