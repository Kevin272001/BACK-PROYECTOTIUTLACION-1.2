const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../models'); // Importa el modelo de Sequelize
require('dotenv').config();

module.exports = function (passport) {
  const opts = {};
  opts.secretOrKey = process.env.SECRET;
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // Buscar usuario por su ID en la base de datos PostgreSQL
        const user = await User.findByPk(jwt_payload.id);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        console.error('❌ Error en la estrategia JWT:', err);
        return done(err, false);
      }
    })
  );
};
