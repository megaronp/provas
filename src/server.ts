const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const adminRoutes = require('./admin/adminRoutes');
const studentRoutes = require('./student/studentRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3100;
const IPURL = `192.168.1.227`;



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use('/admin/static', express.static(path.join(process.cwd(), 'public', 'admin')));
app.use('/student/static', express.static(path.join(process.cwd(), 'public', 'student')));

// Rotas
app.use('/admin', adminRoutes.default);
app.use('/', studentRoutes.default);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Sistema de Provas rodando em http://localhost:${PORT}`);
  console.log(`   📋 Painel do Professor: http://localhost:${PORT}/admin`);
  console.log(`   📊 Relatórios:          http://localhost:${PORT}/admin/relatorio`);
  console.log(`   🎓 Área do Aluno:       http://localhost:${PORT}/\n`);
});
