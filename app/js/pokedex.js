import {IndexedDB, checkIfDatabaseExists} from './indexeddb.js';

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';
const POKE_NUMBER = 'number';
const POKE_NAME = 'name';
const POKE_IMG = 'image';
var pokemonDb = null;

const searchInput = document.getElementById('search');

searchInput.addEventListener('keyup', () => {
    findPokemon(searchInput.value);
});

searchInput.addEventListener('search', () => {
    findPokemon(searchInput.value);
});

function initPokemonDb() {
    pokemonDb = new IndexedDB('pokemonDB', 'pokemon', 1, `++id, ${POKE_NUMBER}, ${POKE_NAME}, ${POKE_IMG}, data`);
}

async function fetchFromNetwork(number) {
    const response = await fetch(`${POKE_API}${number}`);
    const pokemon = await response.json();
    return pokemon;
}

async function fetchImageAndReturnAsBlob(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blob;
}

async function fetchAndStoreFirstGeneration() {

    console.log('Bulk adding first generation from network');
    const numbers = Array.from(new Array(25), (x, i) => i + 1);
    const pokemonsRequests = numbers.map(fetchFromNetwork);
    const pokemons = await Promise.all(pokemonsRequests);

    const pokemonsReducedPromises = pokemons.map(async (pokemon) => {
        const newPokemon = {
            [POKE_NUMBER]: pokemon.id,
            [POKE_NAME]: pokemon.name,
            [POKE_IMG]: await fetchImageAndReturnAsBlob(pokemon.sprites.other['official-artwork'].front_default),
            data: getNewPokemonReduced(pokemon)
        }

        return newPokemon;
    });

    initPokemonDb();

    const pokemonsReduced = await Promise.all(pokemonsReducedPromises);
    await pokemonDb.bulkAdd(pokemonsReduced);
}

async function initPokedex() {

    const dbExists = await checkIfDatabaseExists('pokemonDB');

    if (!dbExists)
        await fetchAndStoreFirstGeneration(); 
    else
        initPokemonDb();

    const pokedex = document.getElementById('pokedex');

    const pokemons = await pokemonDb.getAll();

    pokemons.forEach((pokemon) => pokedex.appendChild(createPokemonCard(pokemon)));
}

function getNewPokemonReduced(pokemon) {
    const pokemonProperties = ['base_experience','height','id','name','order','stats','types','weight'];

    return Object.keys(pokemon).reduce((object, key) => {
        if (pokemonProperties.includes(key)) object[key] = pokemon[key];
        return object;
      }, {})
}

function createPokemonCardNotFound() {
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = 'card not-found';
    h2.innerText = '#';
    img.src = 'app/imgs/icon-256x256.png';
    img.style = 'padding: 1rem;';
    footer.className = 'not-found';
    span.innerText = 'missing';
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function createPokemonCard(pokemon) {
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = `card ${pokemon.data.types[0].type.name}`;
    //div.setAttribute("onclick",`abrirStripes(${number});`);
    h2.innerText = `#${pokemon[POKE_NUMBER]}`;
    img.src = URL.createObjectURL(pokemon[POKE_IMG]);
    img.alt = pokemon[POKE_NAME];
    img.title = pokemon[POKE_NAME];
    img.loading = 'lazy';
    footer.className = pokemon.data.types[0].type.name;
    span.innerText = pokemon[POKE_NAME];
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function filterByNumberOrName(pokemon, char) {
    return pokemon[POKE_NAME].includes(char);
}

async function findPokemon(search) {

    const pokemonList = await pokemonDb.getAll();
    let pokemonsFiltered = pokemonList;
    
    if (search.length !== 0)
        pokemonsFiltered = pokemonList.filter((pokemon) => { return filterByNumberOrName(pokemon, search); });

    const pokedex = document.getElementById('pokedex');
    pokedex.innerHTML = '';

    if (pokemonsFiltered && pokemonsFiltered.length !== 0)
        pokemonsFiltered.forEach((pokemon) => { pokedex.appendChild(createPokemonCard(pokemon)); });
    else
        pokedex.appendChild(createPokemonCardNotFound());
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const onsuccess = () => console.log('[Service Worker] Registered');
        const onerror = () => console.log('[Service Worker] Registration failed:');
        navigator.serviceWorker.register('../../sw.js').then(onsuccess).catch(onerror);
    }
}

async function onInit() {
    registerServiceWorker();
    await initPokedex(); 
}

onInit();
