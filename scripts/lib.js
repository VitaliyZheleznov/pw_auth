async function fetchToStr(url) {
	let contentType = '';
	let charset = '';
	let dataView = '';
	let decoder = '';
	let str = '';
	let error = '';

	await fetch(url)
	.then(res => {
		contentType = res.headers.get('Content-Type');
		charset = contentType.substring(contentType.indexOf("charset=") + 8);
		return res.arrayBuffer();
	})
	.then(ab => {
		dataView = new DataView(ab);
		decoder = new TextDecoder(charset);
		str = decoder.decode(dataView);
	})
	.catch(e => error = e);

	if (error) {
		console.log('Error occured: ', error);
		return null;
	}

	return str;
}

async function getPromoItemsDoc() {
	let promoItemsDoc = await getDOMdoc('https://pw.mail.ru/promo_items.php');

	return promoItemsDoc;
}

function getAccInfo(promoItemsDoc, allowed) {
	// возвращает параметр acc_info для запроса на странице перевода подарков на основе массива разрешенных ников
	// возвращает null в случае отсутствия совпадений между полученными данными и списком разрешенных ников
	// возвращает -1, если нечего переводить
	let servers = getServers(promoItemsDoc);

	if (servers === null)
		return -1;

	for (let i = 0; i < allowed.all.length; i++) {
		let serverName = allowed.all[i];
		let nicks = allowed.byName[serverName];
		let accounts = getAccounts(servers, serverName);
		let serverId = getServerId(servers, serverName);

		if (accounts !== null && serverId !== null) {
			for (let i = 0; i < nicks.length; i++) {
				let nick = nicks[i];
				let accInfo = getAccInfoByNick(accounts, nick);

				if (accInfo !== null) {
					let {accountId, charId} = accInfo;

					return accountId + '_' + serverId + '_' + charId;
				}
			}
		}
	}

	return null;
}

function getAccInfoByNick(accounts, nick) {
	// возвращает объект с полями accountId и charId по нику персонажа или null

	for (let j in accounts) {
		let account = accounts[j];
		let chars = account.chars;

		for (let k in chars) {
			let character = chars[k];

			if (character.name === nick) {
				return {
					accountId: account.id,
					charId: character.id,
				}
			}
		}
	}

	return null;
}

async function getDOMdoc(url) {
	// возвращает html-документ страницы

	let parser = new DOMParser();
	let doc = null;

	await fetch(url).then(res => res.text()).then(res => doc = res); /* загружаем код страницы подарков */
	doc = parser.parseFromString(doc, "text/html"); /* конвертируем результат в читаемый для консоли вид */

	return doc;
}

function getServers(promoItemsDoc) {
	// возвращает объект для связных списков с серверами и персонажами со страницы перевода подарков или null
	let charSelector = promoItemsDoc.getElementsByClassName('char_selector');

	if (charSelector.length === 0)
		return null; // проверка на существование списка персонажей (кейс "если все подарки переведены")

	let charsStr = charSelector[0].nextElementSibling.text; // нужна проверка существования такого элемента? ищет текст соседнего скрипта, куда разработчик поместил связку серверов и персонажей
	let startIndex = charsStr.indexOf('{');

	if (startIndex === -1)
		return null; // найден не тот скрипт

	let servers = JSON.parse(charsStr.substr(startIndex));

	return servers;
}

function getServerId(servers, serverName) {
	// возвращает id сервера по названию серврера или null

	for (let id in servers) {
		if (servers[id].name === serverName)
			return servers[id].id;
	}

	return null;
}

function getAccounts(servers, serverName) {
	// возвращает список аккаунтов по названию сервера или null

	for (let id in servers) {
		if (servers[id].name === serverName)
			return servers[id].accounts;
	}

	return null;
}

export {fetchToStr, getPromoItemsDoc, getAccInfo};

