import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import adminRoutes from './admin/adminRoutes';
import studentRoutes from './student/studentRoutes';

const app = express();
const PORT = process.env.PORT || 3100;
const IPURL = `192.168.1.227`;

// Garante diretórios de dados (nunca apagados pelo build)
const dataDir = path.join(process.cwd(), 'data');
const provasDir = path.join(dataDir, 'provas');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(provasDir)) fs.mkdirSync(provasDir, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use('/admin/static', express.static(path.join(process.cwd(), 'public', 'admin')));
app.use('/student/static', express.static(path.join(process.cwd(), 'public', 'student')));

// Rotas
app.use('/admin', adminRoutes);
app.use('/', studentRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Sistema de Provas rodando em http://${IPURL}:${PORT}`);
  console.log(`   📋 Painel do Professor: http://${IPURL}:${PORT}/admin`);
  console.log(`   📊 Relatórios:          http://${IPURL}:${PORT}/admin/relatorio`);
  console.log(`   🎓 Área do Aluno:       http://${IPURL}:${PORT}/\n`);
});
