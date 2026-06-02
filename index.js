const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB подключена'))
    .catch(err => console.log('Ошибка БД:', err));

// Схема пользователя
const userSchema = new mongoose.Schema({
    login: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Регистрация
app.post('/api/register', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password)
        return res.status(400).json({ error: 'Заполните все поля' });

    const exists = await User.findOne({ login });
    if (exists)
        return res.status(400).json({ error: 'Логин уже занят' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ login, password: hashedPassword });

    res.json({ success: true });
});

// Вход
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    const user = await User.findOne({ login });
    if (!user)
        return res.status(400).json({ error: 'Пользователь не найден' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
        return res.status(400).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ login }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});