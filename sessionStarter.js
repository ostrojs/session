const onHeaders = require('on-headers');
const SessionStoreException = require('./sessionStoreException')
const kStore = Symbol('store')
const kHandler = Symbol('handler')
const kConfig = Symbol('config')
const kCloseSession = Symbol('closeSession')
const { random } = require('lodash')

class SessionStarter {
    constructor(config, handler, store) {
        this[kConfig] = config;
        this[kHandler] = handler;
        this[kStore] = store;
    }

    start(request, response, next) {
        let end = response.end
        let ended = false;
        onHeaders(response, () => {
            if(request.hasOwnProperty("session")){
                this[kHandler].generateSidToCookie(response, request.session.getId())
            }
        });
        
        response.end = (...argument) => {
            if ([404, 500].includes(response.statusCode)) {
                return end.apply(response, argument)
            }
            if (ended) {
                return;
            }
            ended = true
            this[kCloseSession](request, response, function(err) {
                if (err) {
                    return next(new SessionStoreException(err))
                }
                end.apply(response, argument)
            });
        };
        this[kHandler].start(request, response, next)
    }

    [kCloseSession](request, response, callback) {
        if (request.session.touched == true || (this[kConfig]['resave'] == true && request.session.existed == true) || (request.session.existed == false && this[kConfig]['saveUninitialized'] == true)) {
            request.session.save(callback)
        } else {
            callback(null)
        }
        this.collectGarbage();

    }

    collectGarbage() {

        if (this.configHitsLottery()) {
            var period = parseInt(this[kConfig]['lifetime'])+1;
            typeof this[kStore]['destroyExpireSession'] == 'function' && this[kStore].destroyExpireSession(period);
        }
    }

    configHitsLottery() {
        return (random(1, this[kConfig]['lottery'][1]) <= this[kConfig]['lottery'][0]);
    }

}
module.exports = SessionStarter;
