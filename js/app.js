(function(){
    var app = {};

    //possibly required echo nest
    //required spotify

    /***--------- SONG Model ------------ ***/
    app.Song = function(){

    };

    app.Song.prototype.setup = function(title, duration, songUrl){
        this.title = title;
        this.song = duration;
        this.songUrl = songUrl;
        app.song.id++;
        this.id = app.song.id;
    };

    app.Song.id = 0;
    /***--------- SONG Model ------------ ***/

    /***--------- ARTIST Model ------------ ***/
    app.Artist = function(id, name, imageUrl){
        if(!name || !id){
            return;
        }

        this.setup(id, name, imageUrl);
    };

    app.Artist.prototype.setup = function(id, name, imageUrl){
        console.log(imageUrl);
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl || 'http://placehold.it/640x643';
        this.biography = '';
        this.genres = [];
        this.songs = [];

    };

    app.Artist.prototype.addSongs = function(songsJSON){
        for(var i = 0; i < songsJSON.length; i++){
            var song = new app.Song(songsJSON[i]);
        }
    };

    /***--------- ARTIST Model ------------ ***/


    /***--------- ARTIST LIST Collection ------------ ***/
    //@todo: Refactor this to use a static function creating a constructor.
    app.ArtistsList = function(items){
        if(!items){
            return;
        }

        this.setup(items);
    };

    app.ArtistsList.prototype.setup = function(items){
        this.artists = items;
    };

    app.ArtistsList.performSearch = function(query){
        return $.get(app.ArtistsList.SEARCH_URL, {q: query, type: app.ArtistsList.ARTIST_PARAMETER_NAME, limit: 1})
            .then(app.ArtistsList.processArtistResult.bind(null))
            .then(app.ArtistsList.processRelatedArtistResults.bind(null));
    };


    app.ArtistsList.processArtistResult = function(results, error, jQXHR){

        if(!results || !results.artists.items.length){
            return $.Deferred().reject(results, 'No Results', jQXHR);
        }

        //the top one is assumed to be the most related result
        var mostRelevantArtist = results.artists.items[0];

        var url = app.ArtistsList.RELATED_SEARCH_URL.replace('{id}', mostRelevantArtist.id.toString());

        return $.get(url);
    };

    app.ArtistsList.processRelatedArtistResults = function(relatedResults, error, jQXHR){
        if(!relatedResults || !relatedResults.artists.length){
            return $.Deferred().reject(relatedResults, 'No Results', jQXHR);
        }

        var artists = relatedResults.artists;
        var artistsInstances = [];

        //need to loop through the results and create new instance of the artist.
        for(var i = 0; i < artists.length; i ++){
            var relatedArtist = artists[i];

            console.log(relatedArtist.images[0].url);

            artistsInstances.push(new app.Artist(relatedArtist.id, relatedArtist.name, relatedArtist.images[0].url));
        }

        return new app.ArtistsList(artistsInstances);

    };

    app.ArtistsList.SEARCH_URL = 'https://api.spotify.com/v1/search';
    app.ArtistsList.RELATED_SEARCH_URL = 'https://api.spotify.com/v1/artists/{id}/related-artists';
    app.ArtistsList.ARTIST_PARAMETER_NAME = 'artist';
    app.ArtistsList.RELATED_ARTIST_LIMIT = 6;
    app.ArtistsList.IMAGE_URL_KEY = 1;

    /***--------- ARTIST LIST Collection ------------ ***/




    /***--------- SEARCH BOX Controller ------------ ***/
    app.SearchBoxController = function(eventEmitters){

        if(!eventEmitters){
            return;
        }
        this.setup(eventEmitters);
        this.setEvents();
    };


    app.SearchBoxController.prototype.setup = function(eventEmitters){
        this.eventEmitters = eventEmitters;
        this.view = {};
    };

    app.SearchBoxController.prototype.setEvents = function(){
        //add required events
    };

    app.SearchBoxController.prototype.processSearchSubmit = function(searchTerms){
        //fire off an event handler that will allow you to search
        this.eventEmitters.emitEvent('search-artist', [searchTerms]);
    };

    /***--------- SEARCH RESULTS Controller ------------ ***/

    app.SearchResultsController = function(eventEmitters){

        if(!eventEmitters){
            return;
        }
        this.setup(eventEmitters);
        this.setEvents();
    };


    app.SearchResultsController.prototype.setup = function(eventEmitters){
        this.eventEmitters = eventEmitters;
        this.view = {};
    };

    app.SearchResultsController.prototype.setEvents = function(){
        this.eventEmitters.addListener('search-artist', this.searchArtist.bind(this));
    };

    app.SearchResultsController.prototype.searchArtist = function(searchTerms){
        //this.view.showLoadingText();
        app.ArtistsList.performSearch(searchTerms).then(this.processSearchResults.bind(this))
            .fail(this.processSearchError.bind(this));
    };

    app.SearchResultsController.prototype.processSearchResults = function(artistsList){
        this.artistsList = artistsList;

        this.view.showResults(this.artistsList.artists);
    };

    app.SearchResultsController.prototype.processSearchError = function(results, error, JXHR){
        // if no results
        if(error === 'No Results'){
            this.view.showNoResults();
        } else {
            this.view.notifyFatalError();
        }
    };


    /***--------- SEARCH RESULTS Controller ------------ ***/


    /***--------- SEARCH RESULTS Controller ------------ ***/

    app.RelatedArtistController = function(eventEmitters){
        if(!eventEmitters){
            return;
        }

        this.setup(eventEmitters);
        this.setEvents();
    };

    app.RelatedArtistController.prototype.setup = function(eventEmitters){
        this.view = {};
        this.eventEmitters = eventEmitters;
    };


    app.RelatedArtistController.prototype.setEvents = function(){
        this.addEventListener('open-related-artist-modal', app.RelatedArtistController.openRelatedArtistModal.bind(null));
    };

    app.RelatedArtistController.openRelatedArtistModal = function(){
        //we need to to get a few things...
        //artist biography
        //get the songs

    };


    /***--------- SEARCH RESULTS Controller ------------ ***/


    /***--------- SEARCH BOX VIEW ------------ ***/

    app.SearchBoxView = function(controller){
        if(!controller){
            return;
        }
        this.setup(controller);
        this.setEvents();
    };

    app.SearchBoxView.prototype.setup = function(controller){
        this.searchBoxElement = $(app.SearchBoxView.ELEMENT_ID);
        this.controller = controller;

        this.controller.view = this;
    };

    app.SearchBoxView.prototype.setEvents = function(){
        this.searchBoxElement.on('submit', this.processSearchSubmit.bind(this));
    };

    app.SearchBoxView.prototype.processSearchSubmit = function(event){
        event.preventDefault();

        var inputElement = $(event.target).find('input[name="' + app.SearchBoxView.INPUT_NAME + '"]');

        //controller
        var searchTerms = inputElement.val();

        //search terms need to be entered to proceed with the submit
        if(searchTerms.length === 0 || typeof searchTerms.length === 'undefined' ){
            this.notifyNoInput();
            return false;
        }

        this.controller.processSearchSubmit(searchTerms);

    };

    app.SearchBoxView.prototype.notifyNoInput = function(){
        alert('No Search Terms have been entered aborting...');
    };


    app.SearchBoxView.ELEMENT_ID = "#artist-search";
    app.SearchBoxView.INPUT_NAME = 'artist-search';

    /***--------- SEARCH BOX VIEW ------------ ***/

    /***--------- SEARCH RESULTS VIEW ------------ ***/
    app.SearchResultsView = function(controller){
        if(!controller){
            return;
        }

        this.setup(controller);
        this.setEvents();
    };


    app.SearchResultsView.prototype.setup = function(controller){
        this.controller = controller;
        this.resultsContentElement = $(app.SearchResultsView.RESULTS_CONTENT_ID);
        this.defaultTextElement = $(app.SearchResultsView.DEFAULT_TEXT_ID);
        this.loadingTextElement = $(app.SearchResultsView.LOADING_TEXT_ID);
        this.noResultsTextElement = $(app.SearchResultsView.NO_RESULTS_TEXT_ID);
        this.searchItemsListElement = $(app.SearchResultsView.SEARCH_ITEMS_LIST_ID);
        this.searchResultItemElement = $(app.SearchResultsView.SEARCH_ITEM_ELEMENT_ID);

        this.controller.view = this;
        this.showDefaultText();
    };


    app.SearchResultsView.prototype.setEvents = function(){
        this.resultsContentElement.on('click', app.SearchResultsView.SEARCH_ITEM_BUTTON_CLASS, this.processSearchItemClick.bind(this));
    };

    app.SearchResultsView.prototype.processSearchItemClick = function(event){
        event.preventDefault();
        console.log('Need to create functionality to open a modal window with the artist information');
        var id = $(event).target();

    };

    app.SearchResultsView.prototype.showDefaultText = function(){
        this.resultsContentElement.html(ejs.render(this.defaultTextElement.html()));
    };

    app.SearchResultsView.prototype.showLoadingText = function(){
        this.resultsContentElement.html(ejs.render(this.loadingTextElement.html()));
    };

    app.SearchResultsView.prototype.showNoResults = function(){
        this.resultsContentElement.html(ejs.render(this.noResultsTextElement.html()));
    };

    app.SearchResultsView.prototype.showResults = function(results){
        if(!results){
            return;
        }
        //keep a variable of the search results.
        var listElement = $(ejs.render(this.searchItemsListElement.html()));

        for(var i = 0; i < results.length; i++){
            var result = results[i];
            var listItemElement = ejs.render(this.searchResultItemElement.html(), { artist: result });
            listElement.append(listItemElement);
        }

        //add this to the results content
        this.resultsContentElement.html(listElement);
    };

    app.SearchResultsView.prototype.notifyFatalError = function(){
        alert('Woops there seems to be a problem during the process with searching for your inspiration. Please try again or if problems persists, please contact me.');
    };

    app.SearchResultsView.RESULTS_CONTENT_ID = '#results-content';
    app.SearchResultsView.LOADING_TEXT_ID = '#loading-text';
    app.SearchResultsView.DEFAULT_TEXT_ID = '#default-text';
    app.SearchResultsView.NO_RESULTS_TEXT_ID = '#no-results-text';
    app.SearchResultsView.SEARCH_ITEMS_LIST_ID = '#search-items-list';
    app.SearchResultsView.SEARCH_ITEM_ELEMENT_ID = '#search-result-item';
    app.SearchResultsView.SEARCH_ITEM_BUTTON_CLASS = '.search-results__item__button'

    /***--------- SEARCH RESULTS VIEW ------------ ***/


    /***--------- ARTIST MODAL VIEW ------------ ***/
    app.ArtistModalView = function(controller){
        if(!controller){
            return;
        }

        this.setup(controller);
    };

    app.ArtistModalView.prototype.setup = function(controller){
        this.controller = controller;
        this.controller.view = this;
    };

    /***--------- ARTIST MODAL VIEW ------------ ***/



    $(document).ready(function(){
        var eventEmitters = new EventEmitter();

        //instantiate all controllers
        var searchController = new app.SearchBoxController(eventEmitters);
        var searchBoxView = new app.SearchBoxView(searchController);

        var searchResultsController = new app.SearchResultsController(eventEmitters);
        var searchBoxView = new app.SearchResultsView(searchResultsController);


    });
})(jQuery);