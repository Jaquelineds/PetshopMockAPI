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
        if (err.code === 'ENOENT') {
            return [];
        } else {
            throw err;
        }
    }
};

// Função para escrever no arquivo JSON com async/await
const writeJsonFile = async (filePath, data) => {
    try {
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        throw err;
    }
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

// Endpoint para obter um pet específico por ID
app.get('/api/pets/:id', async (req, res) => {
    const petId = parseInt(req.params.id, 10);

    try {
        const pets = await readJsonFile('pets.json');
        const pet = pets.find(p => p.id === petId);

        if (!pet) {
            res.status(404).json({ error: 'Pet não encontrado' });
            return;
        }

        res.json(pet);
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// Adicionar novo pet à lista
app.post('/api/pets/new', async (req, res) => {
    const newPet = req.body;

    try {
        const pets = await readJsonFile('pets.json');
        pets.push(newPet);
        await writeJsonFile('pets.json', pets);

        res.status(201).json({ message: 'Pet registrado com sucesso', pet: newPet });
    } catch (err) {
        console.error('Erro ao processar pet:', err);
        res.status(500).json({ error: 'Erro ao processar pet' });
    }
});

// ==============================
// AGENDAMENTOS
// ==============================

// Informações da clínica
const clinicInfo = {
    name: 'Pet Clinic',
    address: '123 Pet Street',
    phone: '555-555-5555'
};

// Função para agendar um serviço
app.post('/api/scheduleService', async (req, res) => {
    const { petId, serviceId, date, time } = req.body;

    // Validação de parâmetros
    if (!petId || !serviceId || !date || !time) {
        res.status(400).json({ error: 'Todos os parâmetros são necessários: petId, serviceId, date, time' });
        return;
    }

    const newAppointment = {
        petId,
        serviceId,
        date,
        time,
        clinicName: clinicInfo.name,
        clinicAddress: clinicInfo.address,
        clinicPhone: clinicInfo.phone
    };

    try {
        // Ler o arquivo de agendamentos
        const appointments = await readJsonFile('appointments.json');

        // Verificar se já existe um agendamento para o mesmo pet, data e hora
        const conflict = appointments.some(
            appointment => appointment.petId === petId && appointment.date === date && appointment.time === time
        );

        if (conflict) {
            res.status(409).json({ error: 'Conflito de horário: já existe um agendamento para o mesmo pet, data e hora' });
            return;
        }

        // Adicionar o novo agendamento
        appointments.push(newAppointment);

        // Escrever o arquivo atualizado de agendamentos
        await writeJsonFile('appointments.json', appointments);

        // Escrever o último agendamento no arquivo latest_appointment.json
        await writeJsonFile('latest_appointment.json', newAppointment);

        // Responder com o novo agendamento
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

        // Mapear petId para petName
        const appointmentsWithPetNames = appointments.map(appointment => {
            const pet = pets.find(p => p.id === appointment.petId);
            return {
                ...appointment,
                petName: pet ? pet.name : 'Pet não encontrado'
            };
        });

        res.json(appointmentsWithPetNames);
    } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
    }
});

// Endpoint para obter horários de agendamento por id de serviço
app.get('/api/schedule/:id', (req, res) => {
    const serviceId = parseInt(req.params.id, 10);

    fs.readFile('schedule.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler arquivo JSON:', err);
            res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
            return;
        }

        const schedules = JSON.parse(data);
        const schedule = schedules.find(s => s.id === serviceId);

        if (!schedule) {
            res.status(404).json({ error: 'Disponibilidade de serviço não encontrada' });
            return;
        }

        res.json(schedule);
    });
});

// ==============================
// PRODUTOS
// ==============================

// Lista de produtos da loja
app.get('/api/store/products', (req, res) => {
    fs.readFile('petshop_store.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler arquivo JSON:', err);
            res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
            return;
        }

        res.json(JSON.parse(data));
    });
});

app.listen(port, () => {
    console.log(`Mock server running at http://192.168.100.185:${port}/api/`);
});

// Código comentado original
// let callCount = 0;
// app.get('/api/store/products', (req, res) => {
//     callCount++;

//     if (callCount % 2 === 0) {
//         // Simula erro em chamadas pares
//         console.error('Simulated error');
//         res.status(500).json({ error: 'Erro simulado' });
//     } else {
//         fs.readFile('petshop_store.json', 'utf8', (err, data) => {
//             if (err) {
//                 console.error('Erro ao ler arquivo JSON:', err);
//                 res.status(500).json({ error: 'Erro ao ler arquivo JSON' });
//                 return;
//             }

//             res.json(JSON.parse(data));
//         });
//     }
// });