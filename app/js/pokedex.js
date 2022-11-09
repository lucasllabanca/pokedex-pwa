import {IndexedDB, checkIfDatabaseExists} from './indexeddb.js';
import {cuteAlert, cuteToast} from './alert.js';

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

async function rotatePokeball() {
    var pokeball = document.getElementById('pokeball');

    if (pokeball.classList.contains('rotate')) {
        pokeball.classList.remove("rotate");
        pokeball.classList.add("rotate-again");
    }
    else {
        pokeball.classList.remove("rotate-again");
        pokeball.classList.add("rotate");
    }
}

async function showHideLoading() {
    const content = document.getElementById('content');
    const loading = document.getElementById('loading');
    loading.style.display = loading.style.display === 'none' ? '' : 'none';
    content.style.display = loading.style.display === 'none' ? '' : 'none';
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
            [POKE_NAME]: pokemon.name.toLowerCase().trim(),
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

    await bindPokedexFromDb();
    await showHideLoading();
}

function getNewPokemonReduced(pokemon) {
    const pokemonProperties = ['base_experience','height','id','name','order','stats','types','weight'];

    return Object.keys(pokemon).reduce((object, key) => {
        if (pokemonProperties.includes(key)) object[key] = pokemon[key];
        return object;
      }, {})
}

async function bindPokedexFromDb() {
    const pokemons = await pokemonDb.getAll();
    bindPokedex(pokemons);
}

function bindPokedex(pokemons) {

    const pokedex = document.getElementById('pokedex');
    pokedex.innerHTML = '';

    if (pokemons && pokemons.length !== 0)
        pokemons.forEach((pokemon) => pokedex.appendChild(createPokemonCard(pokemon)));
    else
        pokedex.appendChild(createPokemonCardNotFound());
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
    img.alt = 'Missing pokémon';
    img.style = 'padding: 1rem;';
    footer.className = 'not-found';
    span.innerText = 'not found in pokédex nor pokéAPI';
    span.classList.add('ft-sz-20');
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
    const spanDelete = document.createElement('span');
    const imgDelete = document.createElement('img');
    const type = pokemon.data.types[0].type.name;
    div.className = `card ${type}`;
    //div.setAttribute("onclick",`abrirStripes(${number});`);
    h2.innerText = `#${pokemon[POKE_NUMBER]}`;
    img.src = URL.createObjectURL(pokemon[POKE_IMG]);
    img.alt = pokemon[POKE_NAME];
    img.title = pokemon[POKE_NAME];
    footer.className = type;
    span.innerText = pokemon[POKE_NAME];
    spanDelete.className = `btn-remove ${type}`;
    spanDelete.title = 'Remove pokémon from your pokédex';
    spanDelete.addEventListener('click', async () => { await removePokemon(pokemon[POKE_NUMBER], pokemon[POKE_NAME]); });
    imgDelete.src = 'app/imgs/delete-32x32.png';
    imgDelete.alt = 'Remove pokémon from your pokédex';
    imgDelete.title = 'Remove pokémon from your pokédex';
    spanDelete.appendChild(imgDelete);
    header.appendChild(spanDelete);
    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function isNumeric(value) {
    return /^\d+$/.test(value);
}

function filterByNumber(pokemon, value) {
    return pokemon[POKE_NUMBER] == value;
}

function filterByName(pokemon, value) {
    return pokemon[POKE_NAME].includes(value);
}

async function findPokemon(search) {
    rotatePokeball();
    const pokemonList = await pokemonDb.getAll();
    let pokemonsFiltered = pokemonList;
    
    search = search.toLowerCase().trim();
    
    if (search.length !== 0) {
        if (isNumeric(search)) 
            pokemonsFiltered = pokemonList.filter((pokemon) => { return filterByNumber(pokemon, search); });
        else
            pokemonsFiltered = pokemonList.filter((pokemon) => { return filterByName(pokemon, search); });
    }

    bindPokedex(pokemonsFiltered);
}

async function removePokemon(number, name) {

    cuteAlert({
        type: 'question',
        title: `Removing ${name}`,
        message: `Are you sure you want to remove this cute ${name} from your pokédex?`,
        img: 'question.svg',
        confirmText: 'YES',
        cancelText: 'NO'
    }).then(async (e) => { 
        if ( e == 'confirm'){
            await pokemonDb.delete(POKE_NUMBER, number);
            await bindPokedexFromDb();
            cuteToast({
                type: 'success', // or 'info', 'error', 'warning'
                title: 'Removed',
                message: `${name} removed from your pokédex`
            });
        }
    });    
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const onsuccess = () => console.log('[Service Worker] Registered');
        const onerror = () => console.log('[Service Worker] Registration failed:');
        navigator.serviceWorker.register('../../sw.js').then(onsuccess).catch(onerror);
    }
}

async function onInit() {
    await showHideLoading();
    registerServiceWorker();
    await initPokedex(); 
}

onInit();
