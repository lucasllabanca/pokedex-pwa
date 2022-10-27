import {Cache} from './cache.js';

const CACHE_KEY = 'poke-cache-v1';
const cache = new Cache(CACHE_KEY);

async function fetchFromNetwork(requestUrl) {
    console.log('from network');
    const response = await fetch(requestUrl);
    await cache.addToCache(requestUrl, response.clone());
    return response;
}

async function getPokemonByNumber(number) {
    const requestUrl = `https://pokeapi.co/api/v2/pokemon/${number}`
    const response = (await cache.fetchFromCache(requestUrl) || await fetchFromNetwork(requestUrl));
    return await response.json();
}

async function createPokemon(number) {

    const pokemon = await getPokemonByNumber(number);
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = `card ${pokemon.types[0].type.name}`;
    //div.setAttribute("onclick",`abrirStripes(${number});`);
    h2.innerText = `#${pokemon.order}`;
    img.src = pokemon.sprites.front_default;
    img.alt = pokemon.name;
    img.title = pokemon.name;
    footer.className = pokemon.types[0].type.name;
    span.innerText = pokemon.name;
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const onsuccess = () => console.log('[Service Worker] Registered');
        const onerror = () => console.log('[Service Worker] Registration failed:');
        
        navigator.serviceWorker
        .register('../../sw.js')
        .then(onsuccess)
        .catch(onerror);
    }
}

async function onInit() {

    registerServiceWorker();

    const pokedex = document.getElementById('pokedex');
    const pokemonNumbers = Array.from(new Array(151), (x, i) => i + 1);
    //for (let number of pokemonNumbers)
        //pokedex.appendChild(await createPokemon(number));
}

onInit();
