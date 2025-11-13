import fetch from 'node-fetch';

export const handler = async (event) => {
  try {
    const { letra, estilo } = JSON.parse(event.body);

    const resposta = await fetch("https://api.aimusicapi.ai/v1/suno/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AIMUSIC_API_KEY}`,
      },
      body: JSON.stringify({
        custom_mode: true,
        gpt_description_prompt: `Crie uma música completa com voz e instrumental no estilo ${estilo}, com a seguinte letra: ${letra}`,
        make_instrumental: false,
        mv: "chirp-v4",
      }),
    });

    const dados = await resposta.json();
    return {
      statusCode: 200,
      body: JSON.stringify(dados),
    };
  } catch (erro) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: erro.message }),
    };
  }
};
