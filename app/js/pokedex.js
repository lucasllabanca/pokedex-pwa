import {IndexedDB} from './indexeddb.js';

const pokemonProperties = ['base_experience','height','id','name','order','stats','types','weight'];
const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';
const POKE_NUMBER = 'number';
const POKE_NAME = 'name';
const POKE_IMG = 'image';
const pokemonDb = new IndexedDB('pokemonDB', 'pokemon', 1, `++id, ${POKE_NUMBER}, ${POKE_NAME}, ${POKE_IMG}, data`);

const searchInput = document.getElementById('search');
searchInput.addEventListener('keyup', () => {
    findPokemon(searchInput.value);
});
searchInput.addEventListener('search', () => {
    findPokemon(searchInput.value);
});

async function fetchFromNetwork(requestUrl) {
    //console.log('from network:', requestUrl);
    const response = await fetch(requestUrl);
    return response;
}

async function fetchImageAndReturnAsBlob(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blob;
}

function getNewPokemonReduced(pokemon) {
    return Object.keys(pokemon).reduce((object, key) => {
        if (pokemonProperties.includes(key)) object[key] = pokemon[key];
        return object;
      }, {})
}

async function getFromDbOrFetchByNumber(number) {

    var pokemon = await pokemonDb.getByProperty(POKE_NUMBER, number);

    if (pokemon && pokemon.length !== 0) return pokemon[0];

    const requestUrl = `${POKE_API}${number}`;
    const response = await fetchFromNetwork(requestUrl);
    pokemon = await response.json();

    if (pokemon) {
        console.log(`Pokemon added to db: ${number}`);

        const pokemonReduced = getNewPokemonReduced(pokemon);

        pokemon = {
            [POKE_NUMBER]: number,
            [POKE_NAME]: pokemon.name,
            [POKE_IMG]: await fetchImageAndReturnAsBlob(pokemon.sprites.other['official-artwork'].front_default),
            data: pokemonReduced
        }

        await pokemonDb.add(pokemon);

        return pokemon;
    }

    return null;
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

async function createPokemon(number) {

    const pokemon = await getFromDbOrFetchByNumber(number);

    if (!pokemon) return createPokemonCardNotFound();

    return createPokemonCard(pokemon);
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
    console.log(search);
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
