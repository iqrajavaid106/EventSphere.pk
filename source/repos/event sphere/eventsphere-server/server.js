const express = require('express');
const cors = require('cors');
const { supabase } = require('./config/supabase');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/events', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*');

        console.log("🍕 DATA:", data);
        console.log("🚨 ERROR:", error);

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.log("💥 CATCH:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- ENDPOINT: SECURE TICKET PURCHASE ---
app.post('/api/tickets/purchase', async (req, res) => {
    const { userId, eventId, ticketTypeId, quantity } = req.body;

    try {
        const { data: ticketType, error: typeErr } = await supabase
            .from('ticket_types')
            .select('*')
            .eq('ticket_type_id', ticketTypeId)
            .single();

        if (typeErr || !ticketType) return res.status(404).json({ error: "Ticket pricing tier not found" });

        if (ticketType.quantity - ticketType.quantity_sold < quantity) {
            return res.status(400).json({ error: "Not enough tickets left for this seat class" });
        }

        const paymentSuccess = true;

        if (paymentSuccess) {
            const qrCodeHash = Math.random().toString(36).substring(2, 15) + Buffer.from(userId.toString()).toString('base64');

            const { data: ticket, error: ticketErr } = await supabase
                .from('tickets')
                .insert([{
                    event_id: eventId,
                    ticket_type_id: ticketTypeId,
                    owner_id: userId,
                    qr_hash: qrCodeHash,
                    status: 'valid'
                }])
                .select();

            await supabase
                .from('ticket_types')
                .update({ quantity_sold: ticketType.quantity_sold + quantity })
                .eq('ticket_type_id', ticketTypeId);

            return res.json({ message: "Ticket issued smoothly!", ticket });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- ENDPOINT: GET ALL EVENTS ---
app.get('/api/events', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events') // Ensure this matches your Supabase table name
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 EventSphere control network online on port ${PORT}`));