class startSession {
    constructor() {
        this.$session = this.$app['session'];
        if (this.$session instanceof require('../sessionManager')) {
            this.$registered = true;
            this.startSession = this.$session.start()
        }
    }

    handle({ request, response, next }) {
        if (!this.$registered) {
            return next()
        }
        this.startSession(request, response, next)
    }
}

module.exports = startSession