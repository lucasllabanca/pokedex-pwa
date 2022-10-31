import {IndexedDB} from './indexeddb.js';

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';
const POKE_NUMBER = 'number';
const POKE_NAME = 'name';
const POKE_IMG = 'image';
const pokemonDb = new IndexedDB('pokemonDB', 'pokemon', 1, `++id, ${POKE_NUMBER}, ${POKE_NAME}, ${POKE_IMG}, data`);

async function fetchFromNetwork(requestUrl) {
    console.log('from network:', requestUrl);
    const response = await fetch(requestUrl);
    return response;
}

async function fetchImageAndReturnAsBlob(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blob;
}

async function getFromDbOrFetchByNumber(number) {

    var pokemon = await pokemonDb.getByProperty(POKE_NUMBER, number);

    if (pokemon && pokemon.length !== 0) return pokemon[0];

    const requestUrl = `${POKE_API}${number}`;
    const response = await fetchFromNetwork(requestUrl);
    pokemon = await response.json();

    if (pokemon) {
        console.log(`Pokemon added to db: ${number}`);

        pokemon = {
            [POKE_NUMBER]: number,
            [POKE_NAME]: pokemon.name,
            [POKE_IMG]: await fetchImageAndReturnAsBlob(pokemon.sprites.other['official-artwork'].front_default),
            data: pokemon
        }

        await pokemonDb.add(pokemon);

        return pokemon;
    }

    return null;
}

function createPokemonNotFound(number) {
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = 'card notFound';
    h2.innerText = `#${number}`;
    img.src = '../imgs/icon-256x256.png';
    img.alt = number;
    img.title = number;
    footer.className = 'notFound';
    span.innerText = number;
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

async function createPokemon(number) {

    const pokemon = await getFromDbOrFetchByNumber(number);

    if (!pokemon) return createPokemonNotFound(number);

    const pokemonData = pokemon.data;

    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = `card ${pokemonData.types[0].type.name}`;
    //div.setAttribute("onclick",`abrirStripes(${number});`);
    h2.innerText = `#${pokemonData.id}`;
    img.src = URL.createObjectURL(pokemon[POKE_IMG]);
    img.alt = pokemonData.name;
    img.title = pokemonData.name;
    img.loading = 'lazy';
    footer.className = pokemonData.types[0].type.name;
    span.innerText = pokemonData.name;
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function findPokemon(input) {
    console.log(input);
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
    const pokemonNumbers = Array.from(new Array(25), (x, i) => i + 1);
    for (let number of pokemonNumbers)
        pokedex.appendChild(await createPokemon(number));
}

onInit();
