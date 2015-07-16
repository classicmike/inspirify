(function(){
    var app = {};

    //possibly required echo nest
    //required spotify

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

    app.Artist = function(){

    };

    app.Artist.prototype.setup = function(name, biography, songs, genres){
        this.name = name;
        this.biography = biography;
        this.songs = songs;
        this.genres = genres;
    };

    app.Artist.prototype.addSongs = function(songsJSON){
        for(var i = 0; i < songsJSON.length; i++){
            var song = new app.Song(songsJSON[i]);
        }
    };

    /***--------- ARTIST LIST Collection ------------ ***/
    //@todo: Refactor this to use a static function creating a constructor.
    app.ArtistsList = function(items){
        this.setup(items);
        this.setEvents();
    };

    app.ArtistsList.prototype.setup = function(items){
        if(!items){
            console.log('No Items');
            this.resetResults();
        } else {
            console.log('Has Items');
            this.artists = items;
        }
    };

    app.ArtistsList.prototype.resetResults = function(){
        this.artists = [];
    };

    app.ArtistsList.prototype.setEvents = function(){

    };


    app.ArtistsList.performSearch = function(query){
        return $.get(app.ArtistsList.SEARCH_URL, {q: query, type: app.ArtistsList.ARTIST_PARAMETER_NAME, limit: 1})
            .then(app.ArtistsList.processArtistResult.bind(null))
            .then(app.ArtistsList.processRelatedArtistResults.bind(null));
    };


    app.ArtistsList.processArtistResult = function(results, error, variableb){
        console.log(results);
        if(!results || results.artists.items.length === 0){
            return $.Deferred().reject(results, 'No results found');
        }

        if(error){
            console.log('Apparently there is an error');
            console.log(error);
        }
        console.log(variableb);



        //the top one is assumed to be the most related result
        var mostRelevantArtist = results.artists.items[0];

        var url = app.ArtistsList.RELATED_SEARCH_URL.replace('{id}', mostRelevantArtist.id.toString());

        return $.get(url);
    };

    app.ArtistsList.processRelatedArtistResults = function(relatedResults){
        if(!relatedResults || !relatedResults.artists){
            return new app.ArtistsList();
        } else {
            var artists = relatedResults.artists;
            return new app.ArtistsList(artists);
        }
    };

    app.ArtistsList.SEARCH_URL = 'https://api.spotify.com/v1/search';
    app.ArtistsList.RELATED_SEARCH_URL = 'https://api.spotify.com/v1/artists/{id}/related-artists';
    app.ArtistsList.ARTIST_PARAMETER_NAME = 'artist';
    app.ArtistsList.RELATED_ARTIST_LIMIT = 6;

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
        console.log(searchTerms);
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
        app.ArtistsList.performSearch(searchTerms).then(this.processSearchResults.bind(this)).fail(function(results, error){
            console.log('Error');
            console.log(results);
            console.log(error);
        });
    };


    app.SearchResultsController.prototype.processSearchResults = function(artistsList){
        this.artistsList = artistsList;

        if(!this.artistsList.artists.length || this.artistsList.artists.length === 0){
            console.log('trigger functionality to show no results');
        } else {
            //change the view to output the view
            console.log('has results');
        }
    };

    app.SearchResultsController.prototype.processSearchError = function(){

    };


    /***--------- SEARCH RESULTS Controller ------------ ***/


    app.ArtistController = function(){

    };

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

        console.log(this.controller);

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
            alert('No Search Terms have been entered aborting...');
            return false;
        }



        this.controller.processSearchSubmit(searchTerms);

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

        this.controller.view = this;
        this.showDefaultText();
    };


    app.SearchResultsView.prototype.setEvents = function(){

    };

    app.SearchResultsView.prototype.showDefaultText = function(){
        this.resultsContentElement.html(ejs.render($(app.SearchResultsView.DEFAULT_TEXT_ID).html()));
    };

    app.SearchResultsView.prototype.showLoadingText = function(){
        this.resultsContentElement.html(ejs.render($(app.SearchResultsView.LOADING_TEXT_ID).html()));
    };

    app.SearchResultsView.RESULTS_CONTENT_ID = '#results-content';
    app.SearchResultsView.LOADING_TEXT_ID = '#loading-text';
    app.SearchResultsView.DEFAULT_TEXT_ID = '#default-text';

    /***--------- SEARCH RESULTS VIEW ------------ ***/


    /***--------- ARTIST MODAL VIEW ------------ ***/
    app.ArtistModalView = function(){

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