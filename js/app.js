(function(){
    var app = {};

    /***--------- COUNTRY CONVERTER Helper ------------ ***/
    app.CountryConverter = {};

    app.CountryConverter.countries = {};

    //preloads the countries on load.
    app.CountryConverter.init = function(){
        return $.get('js/countries.json')
            .then(app.CountryConverter.processCountryResults.bind(null))
            .fail(app.CountryConverter.processCountryResultsError.bind(null));
    };

    app.CountryConverter.processCountryResults = function(results, error, jQXHR){
        app.CountryConverter.countries = results;
    };

    app.CountryConverter.convertToISOCode = function(countryName){
        if(!countryName){
            return;
        }

        return app.CountryConverter.countries[countryName];

    };

    app.CountryConverter.processCountryResultsError = function(){
        alert('Unfortunately the country converter list was not able to load. Functionality that relies on this to be working may not properly function');
    };
    /***--------- COUNTRY CONVERTER Helper ------------ ***/

    /***--------- TimerConverter Helper ------------ ***/
    app.TimerConverterHelper = {};

    app.TimerConverterHelper.convertToMinutesAndSeconds = function(timeInMilliseconds){
        var minutes = Math.floor(timeInMilliseconds / 60000);
        var seconds = ((timeInMilliseconds % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    };
    /***--------- TimerConverter Helper ------------ ***/

    /***--------- SCROLL TO Helper ------------ ***/
    app.ScrollToHelper = {};

    app.ScrollToHelper.scrollTo = function(id){
        //scroll to
        if(!id){
            return;
        }
        var position = $(id).offset().top;


        if(!position){
            return;
        }

        return $('html,body').animate({'scrollTop': position }, 'slow', 'swing').promise();

    };

    /***--------- SCROLL TO Helper ------------ ***/

    //possibly required echo nest
    //required spotify

    /***--------- SONG Model ------------ ***/
    app.Song = function(id, songUrl, name, duration){
        if(!id || !songUrl || !name){
            return;
        }

        this.setup(id, songUrl, name, duration);
    };

    app.Song.prototype.setup = function(id, songUrl, name, duration){
        this.id = id;
        this.name = name;

        // duration in ms
        this.duration = app.TimerConverterHelper.convertToMinutesAndSeconds(duration);
        this.songUrl = songUrl;
    };

    /***--------- SONG Model ------------ ***/

    /***--------- BIOGRAPHY Model ------------ ***/
    app.Biography = function(text, url, source){


        if(!text || !url || !source){
            return;
        }

        this.setup(text, url, source);
    };

    app.Biography.prototype.setup = function(text, url, source){
        this.text = text;
        this.url = url;
        this.source = source;
    };

    /***--------- BIOGRAPHY Model ------------ ***/

    /***--------- ARTIST Model ------------ ***/
    app.Artist = function(id, name, imageUrl){
        if(!name || !id){
            return;
        }

        this.setup(id, name, imageUrl);
    };

    app.Artist.prototype.setup = function(id, name, imageUrl){
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl || app.Artist.PLACEHOLDER_IMAGE_URL;
        this.biography = '';
        this.songs = [];
        this.countryOfOrigin = '';
    };

    app.Artist.prototype.addBiography = function(){
        var url = app.Artist.BIOGRAPHY_URL.replace(app.Artist.ARTIST_ID_STRING, this.id);
        url = url.replace(app.Artist.API_KEY_STRING, app.Artist.ECHONEST_API_KEY);

        return $.get(url).then(this.processBiographyResult.bind(this));
    };

    app.Artist.prototype.processBiographyResult = function(result, error, jQXHR){

        var response = result.response;

        if(response.status.code !== 0 || response.status.message !== 'Success'){
            return $.Deferred().reject(result, app.Artist.NO_BIOGRAPHY_ERROR_MESSAGE, jQXHR);
        }

        //save and return a boolean to ensure success
        this.getBestBiography(response.biographies);

        return true;
    };

    //designed to grab the 'most reliable' biography of the artist through some very basic heuristic checking.
    app.Artist.prototype.getBestBiography = function(biographyResults){
        //label designed to break out of a double loop
        for(var i = 0; i < app.Artist.POSSIBLE_BIOGRPAHY_SOURCES.length; i++){
            for(var j = 0; j < biographyResults.length; j++){

                if(biographyResults[j].site !== app.Artist.POSSIBLE_BIOGRPAHY_SOURCES[i]){
                    continue; //breaks and continue
                }

                var biographyResult = biographyResults[j];

                if(!biographyResult.truncated){
                    var truncatedText = biographyResult.text.substring(0, app.Artist.BIOGRAPHY_TRUNCATE_SIZE) + app.Artist.FILLER_STRING;
                    this.biography = new app.Biography(truncatedText, biographyResult.url, biographyResult.site);
                } else {
                    this.biography = new app.Biography(biographyResult.text, biographyResult.url, biographyResult.site);
                }
                return;

            }
        }

        //default case for biography results
        this.biography = new app.Biography(biographyResults[0].text, biographyResults[0].url, biographyResults[0].site);
    };


    app.Artist.prototype.getSongs = function(){
        return this.retrieveArtistCountry()
            .then(this.retrieveTopSongs.bind(this));
    };

    app.Artist.prototype.retrieveTopSongs = function(){
        //run an ajax call to retrieve songs from the songs list
        var parameters = { country : this.countryOfOrigin };
        var topSongsUrl = app.Artist.SPOTIFY_TOP_TRACK_URL.replace(app.Artist.ARTIST_ID_STRING, this.id);

        return $.get(topSongsUrl, parameters)
            .then(this.processTopSongResults.bind(this));

    };

    app.Artist.prototype.processTopSongResults = function(result, error, jQXHR){
        var tracks = result.tracks;

        for(var i = 0; i < tracks.length; i++){
            // loop through the track and create instances of a song object.
            var track = tracks[i];

            // add the songs to the songs list of the artist.
            this.songs.push(new app.Song(track.id, track.preview_url, track.name, track.duration_ms));
        }


    };



    app.Artist.prototype.retrieveArtistCountry = function(){
        var locationUrl = app.Artist.ECHO_NEST_LOCATION_ENDPOINT_URL.replace(app.Artist.API_KEY_STRING, app.Artist.ECHONEST_API_KEY).replace(app.Artist.ARTIST_ID_STRING, this.id);
        return $.get(locationUrl)
            .then(this.processArtistCountry.bind(this));
    };

    //need to retreive the
    app.Artist.prototype.processArtistCountry = function(countryResult, error, jQXHR){
        var country = countryResult.response.artist.artist_location.country;

        if(!country){
            return $.Deferred().reject(countryResult, app.Artist.NO_COUNTRY_FOUND_MESSAGE, jQXHR);
        }

        this.countryOfOrigin = app.CountryConverter.convertToISOCode(country);
    };

    app.Artist.prototype.getSongById = function(id){
        if(!id){
            return;
        }

        for(var i = 0; i < this.songs.length; i++){
            if(this.songs[i].id === id){
                return this.songs[i];
            }
        }
    };

    app.Artist.POSSIBLE_BIOGRPAHY_SOURCES = ['last.fm', 'wikipedia', 'mtvmusic', 'itunes'];
    app.Artist.ECHONEST_API_KEY = 'W0SGT7U8YPXFDT6IO';
    app.Artist.BIOGRAPHY_URL = 'http://developer.echonest.com/api/v4/artist/biographies?api_key={YOUR_API_KEY}&id=spotify:artist:{ARTIST_ID}';
    app.Artist.ECHO_NEST_LOCATION_ENDPOINT_URL = 'http://developer.echonest.com/api/v4/artist/profile?api_key={YOUR_API_KEY}&id=spotify:artist:{ARTIST_ID}&bucket=artist_location&format=json';
    app.Artist.SPOTIFY_TOP_TRACK_URL = 'https://api.spotify.com/v1/artists/{ARTIST_ID}/top-tracks';
    app.Artist.ARTIST_ID_STRING = '{ARTIST_ID}';
    app.Artist.API_KEY_STRING = '{YOUR_API_KEY}';
    app.Artist.NO_COUNTRY_FOUND_MESSAGE = 'No origin country found for artist';
    app.Artist.NO_BIOGRAPHY_ERROR_MESSAGE = 'No biography found error';
    app.Artist.PLACEHOLDER_IMAGE_URL = 'http://placehold.it/640x643';
    app.Artist.BIOGRAPHY_TRUNCATE_SIZE = 200;
    app.Artist.FILLER_STRING = '...';

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

            if(relatedArtist.images.length === 0){
                artistsInstances.push(new app.Artist(relatedArtist.id, relatedArtist.name));
            } else {
                artistsInstances.push(new app.Artist(relatedArtist.id, relatedArtist.name, relatedArtist.images[0].url));
            }
        }

        return new app.ArtistsList(artistsInstances);

    };

    app.ArtistsList.prototype.getArtistById = function(id){
        if(!id){
            return;
        }

        for(var i = 0; i < this.artists.length; i++){
            if(this.artists[i].id === id){
                return this.artists[i];
            }
        }
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

        //comeback
        this.eventEmitters.addListener('artist-search-process-error', this.processSearchError.bind(this));
    };

    app.SearchResultsController.prototype.searchArtist = function(searchTerms){
        this.view.showLoadingText();
        this.view.scrollToResults();
        app.ArtistsList.performSearch(searchTerms).then(this.processSearchResults.bind(this))
            .fail(this.processSearchError.bind(this));
    };



    app.SearchResultsController.prototype.processSearchResults = function(artistsList){
        this.artistsList = artistsList;

        this.view.showResults(this.artistsList.artists);
    };


    // come back
    app.SearchResultsController.prototype.processSearchError = function(results, error, JXHR){
        // if no results
        if(error !== 'No Results'){
            this.view.showNoResults();
        } else if(error === 'error' || error === 'Error'){
            this.view.notifyFatalError();
        } else {
            this.view.notifyAppSpecificError(error);
        }
    };



    /***--------- SEARCH RESULTS Controller ------------ ***/


    /***--------- RELATED ARTIST Controller ------------ ***/

    app.RelatedArtistController = function(eventEmitters, artistInstance){

        if(!eventEmitters || !artistInstance){
            return;
        }

        this.setup(eventEmitters, artistInstance);
        this.setEvents();
    };

    app.RelatedArtistController.prototype.setup = function(eventEmitters, artistInstance){
        this.view = {};
        this.eventEmitters = eventEmitters;
        this.artistInstance = artistInstance;
    };

    app.RelatedArtistController.prototype.setEvents = function(){};

    app.RelatedArtistController.openModal = function(artistInstance, searchResultsController){
        if(!artistInstance){
            return;
        }

        //equivalent to promise.all
        $.when(
           //get the artist biography
            artistInstance.addBiography(),
            artistInstance.getSongs()
        ).then(app.RelatedArtistController.processOpenModal.bind(null, artistInstance, searchResultsController))
            .fail(app.RelatedArtistController.processOpenModalError.bind(null, searchResultsController));

    };

    app.RelatedArtistController.processOpenModal = function(artistInstance, searchResultsController){
        //create a new instance of the modal controller and its associated view.
        var modalController = new app.RelatedArtistController(searchResultsController.eventEmitters, artistInstance);
        modalController.view = new app.RelatedArtistModalView(modalController);

    };

    //comeback
    app.RelatedArtistController.processOpenModalError = function(searchResultsController, result, error, jQXHR){
        searchResultsController.processSearchError(result, error, jQXHR);
    };

    app.RelatedArtistController.prototype.loadAndPlaySong = function(songId){
        if(!songId){
            return;
        }

        //get song by id
        var songInstance = this.artistInstance.getSongById(songId);

        //load audio
        if(this.playingSong){
            this.stopSong();
        }

        //get a new instance of the song
        this.playingSong = new Audio(songInstance.songUrl);

        //keeping a attribute with the binding for the showPlayingSongText
        this.playingSongListener = this.view.showPlaySongText.bind(this);
        this.playingSong.addEventListener('loadeddata', this.playingSongListener);

        this.playingSong.play();

    };

    app.RelatedArtistController.prototype.stopSong = function(){
        if(!this.playingSong){
            return;
        }

        this.playingSong.pause();
        this.playingSong.currentTime = 0;
    };

    app.RelatedArtistController.prototype.destroy = function(){
        if(!this.playingSong){
            return;
        }

        this.playingSong.removeEventListener('loadeddata', this.playingSongListener);
    };




    /***--------- RELATED ARTIST Controller ------------ ***/


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
        this.resultsContentElement.on('click', app.SearchResultsView.SEARCH_ITEM_CLASS, this.processSearchItemClick.bind(this));
    };

    app.SearchResultsView.prototype.scrollToResults = function(){
        app.ScrollToHelper.scrollTo(app.SearchResultsView.RESULTS_ELEMENT_ID);
    };

    app.SearchResultsView.prototype.processSearchItemClick = function(event){
        event.preventDefault();
        var clickedElement = $(event.target);

        var id;
        if($(event.target).hasClass(app.SearchResultsView.SEARCH_ITEM_CLASS)){
            id = clickedElement.data('artist-id');
        } else {
            id = clickedElement.parents(app.SearchResultsView.SEARCH_ITEM_CLASS).data('artist-id');
        }

        var artist = this.controller.artistsList.getArtistById(id);

        app.RelatedArtistController.openModal(artist, this.controller);
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

    app.SearchResultsView.prototype.notifyAppSpecificError = function(error){
        if(!error){
            app.notifyFatalError();
        }
        alert('Whoops, Inspirify has encountered the following errors: ' + error + ' Please try again or if problems persists, please contact me.');
    };

    app.SearchResultsView.RESULTS_CONTENT_ID = '#results-content';
    app.SearchResultsView.LOADING_TEXT_ID = '#loading-text';
    app.SearchResultsView.DEFAULT_TEXT_ID = '#default-text';
    app.SearchResultsView.NO_RESULTS_TEXT_ID = '#no-results-text';
    app.SearchResultsView.SEARCH_ITEMS_LIST_ID = '#search-items-list';
    app.SearchResultsView.SEARCH_ITEM_ELEMENT_ID = '#search-result-item';
    app.SearchResultsView.SEARCH_ITEM_CLASS = '.search-results__item';
    app.SearchResultsView.RESULTS_ELEMENT_ID = '#results';

    /***--------- SEARCH RESULTS VIEW ------------ ***/


    /***--------- ARTIST MODAL VIEW ------------ ***/
    app.RelatedArtistModalView = function(controller){
        if(!controller){
            return;
        }

        this.setup(controller);
        this.setEvents();
        this.open();
    };

    app.RelatedArtistModalView.prototype.setup = function(controller){
        this.controller = controller;
        this.controller.view = this;
        this.bodyElement = $(app.RelatedArtistModalView.BODY_SELECTOR);
        this.relatedArtistTemplateElement = $(app.RelatedArtistModalView.MODAL_TEMPLATE_ID);
        this.relatedArtistModalElement = null;
        this.songLoadingTemplate = $(app.RelatedArtistModalView.LOADING_SONG_TEMPLATE_ID);
        this.playSongTemplate = $(app.RelatedArtistModalView.PLAY_SONG_TEMPLATE_ID);
    };

    app.RelatedArtistModalView.prototype.setEvents = function(){

        //destroying the instance
        this.destroyInstanceListener = this.destroyInstance.bind(this);
        this.playSongClickedListener = this.playSongClicked.bind(this);

        //the first event hooks onto bootstraps closed modal event then proceeds to destroy the modal view and its associated controller
        this.bodyElement.on('hidden.bs.modal', app.RelatedArtistModalView.MODAL_CLASS, this.destroyInstanceListener)
            .on('click', app.RelatedArtistModalView.PLAY_CLICK_CELL_CLASS, this.playSongClickedListener);
    };


    app.RelatedArtistModalView.prototype.render = function(){
        var relatedModalHTML = ejs.render(this.relatedArtistTemplateElement.html(), { artist: this.controller.artistInstance });
        this.bodyElement.append(relatedModalHTML);

        var artistId = this.controller.artistInstance.id;
        this.relatedArtistModalElement = $('#modal-' + artistId);
    };

    app.RelatedArtistModalView.prototype.open = function(){
        this.render();

        this.relatedArtistModalElement.modal('show');
    };

    app.RelatedArtistModalView.prototype.playSongClicked = function(event){
        event.preventDefault();
        var clickedElement = $(event.target);

        if(!clickedElement.data('song-id')){
            clickedElement = clickedElement.parents('[data-song-id]');
        }

        var songId = clickedElement.data('song-id');

        if(!songId){
            return false;
        }

        this.showSongLoadingText(clickedElement);

        this.controller.loadAndPlaySong(songId);

    };



    //wrote this method to destroy the modal controller and view instances so that it does not take any memory after it is no longer used
    app.RelatedArtistModalView.prototype.destroyInstance = function(){
        this.relatedArtistModalElement.remove();

        //stop the song
        this.controller.stopSong();

        //destroy the controller instance
        this.controller.destroy();

        //destroy the instance of the song
        this.bodyElement.off('hidden.bs.modal', app.RelatedArtistModalView.MODAL_CLASS, this.destroyInstanceListener)
            .off('click', app.RelatedArtistModalView.PLAY_CLICK_CELL_CLASS, this.playSongClickedListener);
    };


    app.RelatedArtistModalView.prototype.showSongLoadingText = function(element){
        element.html(ejs.render(this.songLoadingTemplate.html()));
    };

    app.RelatedArtistModalView.prototype.showPlaySongText = function(){
        $(app.RelatedArtistModalView.PLAY_CLICK_CELL_CLASS).html(ejs.render(this.playSongTemplate.html()));
    };

    app.RelatedArtistModalView.prototype.notifySongLoadingError = function(){
        alert(app.RelatedArtistModalView.SONG_LOADING_ERROR_MESSAGE);
        this.showPlaySongText();
    };

    app.RelatedArtistModalView.BODY_SELECTOR = 'body';
    app.RelatedArtistModalView.MODAL_TEMPLATE_ID = '#related-artist-modal';
    app.RelatedArtistModalView.MODAL_CLASS = '.related-artist-modal';
    app.RelatedArtistModalView.LOADING_SONG_TEMPLATE_ID = '#loading-song';
    app.RelatedArtistModalView.PLAY_SONG_TEMPLATE_ID = '#play-song';
    app.RelatedArtistModalView.PLAY_CLICK_CELL_CLASS = '.playlist__cell__play';
    app.RelatedArtistModalView.SONG_LOADING_ERROR_MESSAGE = 'Unfortunately there seems to be an error loading that particular song. Please try again or contact me if the problems persist.';



    /***--------- ARTIST MODAL VIEW ------------ ***/

    /***--------- NAVIGATION VIEW ------------ ***/
    app.NavigationView = function(){
        this.navElement = $(app.NavigationView.NAV_SCROLL_TO_CLASS);
        this.setEvents();
    };

    app.NavigationView.prototype.setEvents = function(){
        this.navElement.on('click', this.navigationClicked.bind(this));
    };

    app.NavigationView.prototype.navigationClicked = function(event){
        var id = $(event.target).attr('href');
        app.ScrollToHelper.scrollTo(id);
    };

    app.NavigationView.NAV_SCROLL_TO_CLASS = '.nav-scroll-to';

    /***--------- NAVIGATION VIEW ------------ ***/



    $(document).ready(function(){
        app.CountryConverter.init().then(function(){
            var eventEmitters = new EventEmitter();

            var navigationView = new app.NavigationView();

            //instantiate all controllers
            var searchController = new app.SearchBoxController(eventEmitters);
            var searchBoxView = new app.SearchBoxView(searchController);

            var searchResultsController = new app.SearchResultsController(eventEmitters);
            var searchBoxView = new app.SearchResultsView(searchResultsController);
        });
    });
})(jQuery);