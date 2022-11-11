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

function showHidePokedexPokemon() {
    const pokemon = document.getElementById('pokemon');
    const content = document.getElementById('content');
    pokemon.style.display = pokemon.style.display === 'none' ? '' : 'none';
    content.style.display = pokemon.style.display === 'none' ? '' : 'none';
}

async function showHideLoading() {
    const content = document.getElementById('content');
    const loading = document.getElementById('loading');
    loading.style.display = loading.style.display === 'none' ? '' : 'none';
    content.style.display = loading.style.display === 'none' ? '' : 'none';
}

async function fetchPokemonFromNetwork(numberOrName) {
    try {
        const response = await fetch(`${POKE_API}${numberOrName}`);

        if (response.status !== 200) return null;
    
        const pokemon = await response.json();
        return pokemon;
    } 
    catch (e) {
        cuteToast({
            type: 'error', // success, info, error, warning
            title: 'ERROR',
            message: `Error while searching for pokémon in pokéAPI. Maybe you're offline!`,
            timer: 5000
        });

        return null;
    }
}

async function fetchImageAndReturnAsBlob(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return blob;
    }
    catch (e) {
        return new Blob(undefined, undefined);
    }
}

async function fetchAndStoreFirstGeneration() {

    console.log('Bulk adding first generation from network');
    const numbers = Array.from(new Array(151), (x, i) => i + 1);
    const pokemonsRequests = numbers.map(fetchPokemonFromNetwork);
    const pokemons = await Promise.all(pokemonsRequests);

    const pokemonsReducedPromises = pokemons.map(getNewPokemonReduced);

    initPokemonDb();

    const pokemonsReduced = await Promise.all(pokemonsReducedPromises);
    const pokemonsNotNull = await pokemonsReduced.filter(pokemon => pokemon);

    if (pokemonsNotNull && pokemonsNotNull.length !== 0)
        await pokemonDb.bulkAdd(pokemonsNotNull);
}

async function initPokedex() {

    const dbExists = await checkIfDatabaseExists('pokemonDB');

    if (!dbExists)
        await fetchAndStoreFirstGeneration();
    else
        initPokemonDb();

    await bindPokedexFromDb();
    await showHideLoading();

    if (!dbExists) {
        cuteAlert({
            type: 'info',
            title: 'Welcome!',
            message: `This first time, the 1º generation of pokémon (151) was added, so you can play around.<br/>
                      You can search for your pokémon in your pokédex or for any other in pokéAPI.<br/>
                      You can also remove from pokédex or add from pokéAPI to your pokédex.<br/>
                      Your pokédex also works offline.`,
            img: 'info.svg',
            buttonText: `Let's Go`
        });
    }
}

async function getNewPokemonReduced(pokemon) {

    if (!pokemon) return pokemon;

    const newPokemon = {
        [POKE_NUMBER]: pokemon.id,
        [POKE_NAME]: pokemon.name.toLowerCase().trim(),
        [POKE_IMG]: await fetchImageAndReturnAsBlob(pokemon.sprites.other['official-artwork'].front_default),
        data: reducePokemon(pokemon)
    }

    return newPokemon;
}

function reducePokemon(pokemon) {
    const pokemonProperties = ['base_experience','height','id','name','order','stats','types','weight'];

    return Object.keys(pokemon).reduce((object, key) => {
        if (pokemonProperties.includes(key)) object[key] = pokemon[key];
        return object;
      }, {})
}

async function bindPokedexFromDb() {
    document.getElementById('search').value = '';
    const pokemons = await pokemonDb.getAll();
    bindPokedex(pokemons, false, true);
}

function bindPokedex(pokemons, fromPokeApi, fromDb) {

    const pokedex = document.getElementById('pokedex');
    pokedex.innerHTML = '';

    if (pokemons && pokemons.length !== 0)
        pokemons.forEach((pokemon) => pokedex.appendChild(createPokemonCard(pokemon, fromPokeApi, false)));
    else {
        if (fromDb)
            pokedex.appendChild(createEmptyPokedex());
        else
            pokedex.appendChild(createPokemonCardNotFound(false));
    }
}

async function bindPokedexFromDbOrFromSearch() {
    const search = document.getElementById('search').value;

    if (search.length !== 0) {
        const pokemonsFiltered = document.getElementsByClassName('card');
        
        if (pokemonsFiltered.length > 1)
            await findPokemon(search);
        else
            await bindPokedexFromDb();
    } 
    else
        await bindPokedexFromDb();
}

function createEmptyPokedex() { 
    const div = document.createElement('div');
    const img = document.createElement('img');
    const footer = document.createElement('footer');
    const span = document.createElement('span');
    div.className = 'card bd-none';
    img.className = 'wd-empty cursor-default';
    img.src = 'app/imgs/pokedex.png';
    img.alt = 'Empty pokédex';
    img.title = 'Empty pokédex';
    footer.className = 'mt-empty empty cursor-default';
    span.innerHTML = 'Your pokédex is empty.<br/>Try searching for new pokémon and add them.';
    span.classList.add('ft-sz-18');
    div.appendChild(img);
    footer.appendChild(span);
    div.appendChild(footer);
    return div;
}

function createPokemonCardNotFound(addGoBack) {
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    div.className = 'card not-found';
    h2.innerText = '#';
    img.src = 'app/imgs/icon-256x256.png';
    img.alt = 'Not found';
    img.title = 'Not found';
    img.style = 'padding: 1rem;';
    footer.className = 'not-found cursor-default';
    span.innerText = 'not found in pokédex nor pokéAPI';
    span.classList.add('ft-sz-20');
    img.classList.add('cursor-default');

    if (addGoBack) {
        span.innerText = 'not found in pokédex';
        const spanAcao = document.createElement('span');
        const imgAcao = document.createElement('img');
        spanAcao.className = 'btn-back not-found';
        spanAcao.title = 'Go back to pokédex';
        spanAcao.addEventListener('click', () => { showHidePokedexPokemon(); });
        imgAcao.src = 'app/imgs/back-32x32.png';
        imgAcao.alt = 'Go back to pokédex';
        imgAcao.title = 'Go back to pokédex';
        spanAcao.appendChild(imgAcao);
        header.appendChild(spanAcao);
    }

    header.appendChild(h2);
    footer.appendChild(span);
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(footer);
    return div;
}

function createPokemonCard(pokemon, fromPokeApi, addGoBack) {
    const div = document.createElement('div');
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    const h2 = document.createElement('h2');
    const img = document.createElement('img');
    const span = document.createElement('span');
    const spanAcao = document.createElement('span');
    const imgAcao = document.createElement('img');
    const type = pokemon.data.types[0].type.name;
    div.className = `card ${type}`;
    h2.innerText = `#${pokemon[POKE_NUMBER]}`;
    img.src = URL.createObjectURL(pokemon[POKE_IMG]);
    img.alt = pokemon[POKE_NAME];
    img.title = pokemon[POKE_NAME];
    footer.className = type;
    span.innerText = pokemon[POKE_NAME];

    if (fromPokeApi || addGoBack) {
        img.classList.add('cursor-default');
        footer.classList.add('cursor-default');
    }
    
    if (fromPokeApi) {

        spanAcao.className = `btn-add ${type}`;
        spanAcao.title = `Add ${pokemon[POKE_NAME]} to your pokédex`;
        spanAcao.addEventListener('click', async () => { await addPokemon(pokemon); });
        imgAcao.src = 'app/imgs/add.png';
        imgAcao.alt = `Add ${pokemon[POKE_NAME]} to your pokédex`;
        imgAcao.title = `Add ${pokemon[POKE_NAME]} to your pokédex`;
        
    } else {

        if (addGoBack) {
            spanAcao.className = `btn-back ${type}`;
            spanAcao.title = 'Go back to pokédex';
            spanAcao.addEventListener('click', () => { showHidePokedexPokemon(); });
            imgAcao.src = 'app/imgs/back-32x32.png';
            imgAcao.alt = 'Go back to pokédex';
            imgAcao.title = 'Go back to pokédex';
        } else {
            img.addEventListener('click', () => { openPokemon(pokemon); });
            footer.addEventListener('click', () => { openPokemon(pokemon); });
            spanAcao.className = `btn-remove ${type}`;
            spanAcao.title = `Remove ${pokemon[POKE_NAME]} from your pokédex`;
            spanAcao.addEventListener('click', async () => { await deletePokemon(pokemon); });
            imgAcao.src = 'app/imgs/delete-32x32.png';
            imgAcao.alt = `Remove ${pokemon[POKE_NAME]} from your pokédex`;
            imgAcao.title = `Remove ${pokemon[POKE_NAME]} from your pokédex`;
        }
    }

    spanAcao.appendChild(imgAcao);
    header.appendChild(spanAcao);
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
    var pokemonsFiltered = pokemonList;
    
    search = search.toLowerCase().trim();

    var fromPokeApi = false;

    if (search.length !== 0) {

        if (isNumeric(search)) 
            pokemonsFiltered = pokemonList.filter((pokemon) => { return filterByNumber(pokemon, search); });
        else
            pokemonsFiltered = pokemonList.filter((pokemon) => { return filterByName(pokemon, search); });
    
        if (!pokemonsFiltered || pokemonsFiltered.length === 0) {

            const pokemon = await fetchPokemonFromNetwork(search);

            if (pokemon) {
                const pokemonReduced = await getNewPokemonReduced(pokemon);
                pokemonsFiltered.push(pokemonReduced);
                fromPokeApi = true;
            }
        }
    }

    bindPokedex(pokemonsFiltered, fromPokeApi, false);
}

async function addPokemon(pokemon) {

    cuteAlert({
        type: 'question-add',
        title: `Adding ${pokemon[POKE_NAME]}`,
        message: `Are you sure you want to add this cute ${pokemon[POKE_NAME]} to your pokédex?`,
        img: 'question.svg',
        confirmText: 'YES',
        cancelText: 'NO',
        cancelType: 'error'
    }).then(async (e) => { 
        if ( e == 'confirm') {
            await pokemonDb.add(pokemon);
            bindPokedex([pokemon], false, false);
            cuteToast({
                type: 'info', // success, info, error, warning
                title: 'ADDED',
                message: `${pokemon[POKE_NAME]} added to pokédex`
            });
        }
    });    
}

async function deletePokemon(pokemon) {

    cuteAlert({
        type: 'question-remove',
        title: `Removing ${pokemon[POKE_NAME]}`,
        message: `Are you sure you want to remove this cute ${pokemon[POKE_NAME]} from your pokédex?`,
        img: 'question.svg',
        confirmText: 'YES',
        cancelText: 'NO',
        cancelType: 'info'
    }).then(async (e) => { 
        if ( e == 'confirm') {
            await pokemonDb.delete(POKE_NUMBER, pokemon[POKE_NUMBER]);
            await bindPokedexFromDbOrFromSearch();
            cuteToast({
                type: 'error', // success, info, error, warning
                title: 'REMOVED',
                message: `${pokemon[POKE_NAME]} removed from pokédex`
            });
        }
    });    
}

function bindPokemon(pokemon) {
    const pokemonDiv = document.getElementById('pokemon');
    pokemonDiv.innerHTML = '';

    if (pokemon)
        pokemonDiv.appendChild(createPokemonCard(pokemon, false, true));
    else
        pokemonDiv.appendChild(createPokemonCardNotFound(true));
}

function openPokemon(pokemon) {
    bindPokemon(pokemon);
    showHidePokedexPokemon();
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
