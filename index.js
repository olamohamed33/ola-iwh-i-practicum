require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const COBJ = process.env.CUSTOM_OBJECT_TYPE || 'contacts';

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

app.get('/', async (req, res) => {
  try {
    const props = ['full_name', 'bio', 'other', 'email'];

    const resp = await hubspot.get(`/crm/v3/objects/${COBJ}`, {
      params: {
        properties: props.join(','),
        limit: 100
      }
    });

    const records = resp.data.results || [];
    res.render('homepage', { title: 'Homepage', records, props });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.render('homepage', {
      title: 'Homepage',
      records: [],
      props: [],
      error: 'Failed to fetch records'
    });
  }
});

app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});

app.post('/update-cobj', async (req, res) => {
  try {
    // قبول القيم سواء كانت مرسلة ك full_name أو ك name (fallback)
    const fullNameValue = req.body.full_name || req.body.name || '';
    const bioValue = req.body.bio || '';
    const otherValue = req.body.other || '';
    const emailValue = req.body.email || '';

    const body = {
      properties: {
        full_name: fullNameValue,
        bio: bioValue,
        other: otherValue,
        email: emailValue
      }
    };

    await hubspot.post(`/crm/v3/objects/${COBJ}`, body);

    res.redirect('/');
  } catch (err) {
    console.error('Error creating record:', err.response?.data || err.message);
    res.status(500).send('Error creating record');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
