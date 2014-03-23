import json
from bs4 import BeautifulSoup
from caching import get_soup as get

BASE = "http://www.superherodb.com"

def save_superheroes():
    """ Scrape all superhero data and save it to a JSON file. """
    superheroes = get_all_data()
    clean_list = remove_default(superheroes)

    with open('superheroes.json', 'w') as outfile:
        json.dump(clean_list, outfile)

def get_all_data():
    """Scrape all superhero data. """

    start_url = "http://www.superherodb.com/characters/"

    soup = get(start_url)

    links = soup.findAll('li', {'class': 'listitem'})

    superheroes = []
    for link in links:
        url = BASE + link.a['href']
        superhero = get_superhero_data(url)
        superheroes.append(superhero)
        print superhero['name']

    return superheroes

def get_superhero_data(url):
    superhero = {}

    # Id
    superhero_id = url.split('/')[4][3:]
    superhero['id'] = int(superhero_id)

    soup = get(url)

    superhero['name'] = soup.h1.text

    # Powergrid
    right_col = soup.find('div', {'class': 'contentColRight'})
    table = right_col.find('div', {'class': 'tableHolder'})
    rows = table.findAll('div', {'class': 'tableRow'})

    attributes = {}

    for row in rows:
        key = row.find('div', {'class': 'tableCaptionGrid'}).text
        value = row.find('div', {'class': 'tableCaptionGridNr'}).text
        attributes[key] = int(value)

    superhero['attributes'] = attributes

    # Image
    img_div = soup.find('div', {'class': 'picPortrait'})
    img_src = img_div.img['src']
    img_url = BASE + img_src
    superhero['img'] = img_url

    return superhero

def remove_default(superheroes):
    """ Many superheroes have 1 for all their attributes. Remove them. """
    num_attributes = len(superheroes[0]['attributes'])
    default_attributes = [1]*num_attributes

    complete = [s for s in superheroes if s['attributes'].values() != default_attributes]
    return complete

if __name__ == "__main__":
    save_superheroes()
