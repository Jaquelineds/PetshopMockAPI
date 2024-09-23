const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

// Função para ler o arquivo JSON com async/await
const readJsonFile = async (filePath) => {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
};

// Função para escrever no arquivo JSON com async/await
const writeJsonFile = async (filePath, data) => {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
};

// ==============================
// PETS
// ==============================

// Lista de pets
app.get('/api/pets', async (req, res) => {
    try {
        const pets = await readJsonFile('pets.json');
        res.json(pets);
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// Obter um pet específico por ID
app.get('/api/pets/:id', async (req, res) => {
    const petId = parseInt(req.params.id, 10);
    try {
        const pets = await readJsonFile('pets.json');
        const pet = pets.find(p => p.id === petId);
        res.status(pet ? 200 : 404).json(pet || { error: 'Pet não encontrado' });
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// Adicionar novo pet
app.post('/api/pets/new', async (req, res) => {
    try {
        const pets = await readJsonFile('pets.json');
        pets.push(req.body);
        await writeJsonFile('pets.json', pets);
        res.status(201).json({ message: 'Pet registrado com sucesso', pet: req.body });
    } catch (err) {
        console.error('Erro ao processar pet:', err);
        res.status(500).json({ error: 'Erro ao processar pet' });
    }
});

// ==============================
// AGENDAMENTOS
// ==============================

const clinicInfo = {
    name: 'Pet Clinic',
    address: '123 Pet Street',
    phone: '555-555-5555'
};

// Agendar um serviço
app.post('/api/scheduleService', async (req, res) => {
    const { petId, serviceId, date, time } = req.body;
    if (!petId || !serviceId || !date || !time) {
        return res.status(400).json({ error: 'Todos os parâmetros são necessários: petId, serviceId, date, time' });
    }

    const newAppointment = { petId, serviceId, date, time, ...clinicInfo };

    try {
        const appointments = await readJsonFile('appointments.json');
        const conflict = appointments.some(a => a.petId === petId && a.date === date && a.time === time);

        if (conflict) {
            return res.status(409).json({ error: 'Conflito de horário' });
        }

        appointments.push(newAppointment);
        await writeJsonFile('appointments.json', appointments);
        await writeJsonFile('latest_appointment.json', newAppointment);
        res.status(201).json(newAppointment);
    } catch (err) {
        console.error('Erro ao processar agendamento:', err);
        res.status(500).json({ error: 'Erro ao processar agendamento' });
    }
});

// Lista de agendamentos
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await readJsonFile('appointments.json');
        const pets = await readJsonFile('pets.json');

        const appointmentsWithPetNames = appointments.map(a => {
            const pet = pets.find(p => p.id === a.petId);
            return { ...a, petName: pet ? pet.name : 'Pet não encontrado' };
        });

        res.json(appointmentsWithPetNames);
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// Obter horários de agendamento por id de serviço
app.get('/api/schedule/:id', async (req, res) => {
    const serviceId = parseInt(req.params.id, 10);
    try {
        const schedules = await readJsonFile('schedule.json');
        const schedule = schedules.find(s => s.id === serviceId);
        res.status(schedule ? 200 : 404).json(schedule || { error: 'Disponibilidade de serviço não encontrada' });
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// ==============================
// PRODUTOS
// ==============================

// Lista de produtos da loja
app.get('/api/store/products', async (req, res) => {
    try {
        const products = await readJsonFile('petshop_store.json');
        res.json(products);
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// ==============================
// COMPRA
// ==============================

// Endpoint para finalizar a compra
app.post('/api/purchase', async (req, res) => {
    const { products, cartItems, paymentData } = req.body;
    if (!products || !cartItems || !paymentData) {
        return res.status(400).json({ error: 'Todos os parâmetros são necessários' });
    }

    const purchases = await readJsonFile('purchases.json');
    const orderId = purchases.length + 1;
    const purchaseConfirmation = { orderId, cartItems, status: 'Compra finalizada com sucesso' };

    purchases.push(purchaseConfirmation);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Delay de 3 segundos
    await writeJsonFile('purchases.json', purchases);
    res.status(201).json(purchaseConfirmation);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Mock server running`);
});