Title: Building a superhero Top Trumps game using Python and Ractive.js
Date: 2014-03-22 10:20
Tags: pelican, publishing
Slug: top-trumps-tutorial
Summary: Short version for index and feeds

I want to build a superhero [Top Trumps](http://en.wikipedia.org/wiki/Top_trumps) game. 
The data is available over at the [Superhero Database](http://superherodb.com/). Partially inspired by Ractive tutorials..
Unforunately they don't have an API so we have to scrape the data.
We first build a scraper in Python and then build a simple Top Trumps game using [Ractive.js](http://www.ractivejs.org/).

Scraping the data
-----------------
The approach I took to scraping the data here is heavily informed by [this post](http://brianabelson.com/open-news/2013/12/17/scrape-the-gibson.html) from Brian Abelson.
It makes use of really useful library of caching functions I stole from that blog post. A `cache/` directory is created where a local copy of each html page is stored the first time you scrape it. This copy is used for any future requests to that url. This means that as you debug your code or decide you want more data from the page, you're not bombarding the websites servers with requests.

The data we're going to get is located in the Powergrid for each character. So, e.g., for [Aqualad](http://www.superherodb.com/Aqualad/10-1395/) we want to get values for intelligence, strength, speed, durability, power and combat.

We have a `get_superhero_data` function which starts by creating an empty `superhero` dict which will store all our data.

    :::python
    def get_superhero_data(url):
        superhero = {}

We then parse the ID of the superhero from the url:

    :::python
    superhero_id = url.split('/')[4][3:]
    superhero['id'] = int(superhero_id)

it's the last 3 digits of the URL. We then add the id to the `superhero` dict.

We can get a BeautifulSoup of our page using our caching `get` function:

    :::python
    soup = get(url)

The superhero's name is the only `h1` element on the page, so we get that as follows:

   :::python 
    superhero['name'] = soup.h1.text

To get the values in the Powergrid, we notice that it's actually a div with a class of tableHolder. There are a few tableHolder's on the page so we specify that we want the one contained in a div with class contentColRight. Then each row of the table is a div with class tableRow.

    :::python
    # Powergrid
    right_col = soup.find('div', {'class': 'contentColRight'})
    table = right_col.find('div', {'class': 'tableHolder'})
    rows = table.findAll('div', {'class': 'tableRow'})

We then parse each row in the table capturing the title and the value on each row:

    :::python
    for row in rows:
        key = row.find('div', {'class': 'tableCaptionGrid'}).text
        value = row.find('div', {'class': 'tableCaptionGridNr'}).text
        superhero[key] = int(value)

The last element we need for each superhero is an image. The image is contained in a div with a class of picPortrait.

    :::python
    # Image
    img_div = soup.find('div', {'class': 'picPortrait'})
    img_src = img_div.img['src']
    img_url = BASE + img_src
    superhero['img'] = img_url

This gives us all the data we need to build a Top Trumps card for a superhero.

We then run this function for every url shown in the [index](http://www.superherodb.com/characters/)

    :::python
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

We save this data in a JSON file:

    :::python
    def save_superheroes():
        """ Scrape all superhero data and save it to a JSON file. """
        superheroes = get_all_data()

        with open('superheroes.json', 'w') as outfile:
            json.dump(superheroes, outfile)

Could maybe save it in a database (see Dataset).

Building the game
-----------------

