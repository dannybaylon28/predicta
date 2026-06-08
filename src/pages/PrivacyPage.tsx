import { Link } from "react-router-dom";
import { APP_DOMAIN, APP_NAME } from "../constants/brand";

export function PrivacyPage() {
  return (
    <article className="legal-page">
      <p className="overline">Legal</p>
      <h1>Politica de privacidad</h1>
      <p className="legal-updated">Ultima actualizacion: 7 de junio de 2026</p>

      <section>
        <h2>1. Responsable</h2>
        <p>
          {APP_NAME} ({APP_DOMAIN}) opera esta plataforma. Puedes contactarnos en{" "}
          <a href={`mailto:hola@${APP_DOMAIN}`}>hola@{APP_DOMAIN}</a>.
        </p>
      </section>

      <section>
        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li>
            <strong>Cuenta:</strong> nombre visible, correo electronico y foto de perfil si inicias
            sesion con Google.
          </li>
          <li>
            <strong>Actividad en ligas:</strong> predicciones, membresias, puntos y configuracion de
            ligas que creas o a las que te unes.
          </li>
          <li>
            <strong>Tecnico:</strong> datos basicos de uso, identificadores de sesion y registros de
            errores para mantener el servicio.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Para que usamos tus datos</h2>
        <ul>
          <li>Autenticarte y mantener tu sesion.</li>
          <li>Mostrar clasificaciones, predicciones y ligas compartidas.</li>
          <li>Permitir invitaciones por codigo o enlace.</li>
          <li>Mejorar estabilidad, seguridad y experiencia de uso.</li>
        </ul>
      </section>

      <section>
        <h2>4. Con quien se comparten</h2>
        <p>
          Tus predicciones en partidos finalizados pueden ser visibles para otros miembros de la misma
          liga. No vendemos tus datos personales.
        </p>
        <p>Usamos proveedores necesarios para operar el servicio, entre ellos:</p>
        <ul>
          <li>
            <strong>Google Firebase:</strong> autenticacion, base de datos y alojamiento.
          </li>
          <li>
            <strong>Fuentes de calendario del torneo:</strong> datos publicos de partidos y
            resultados.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Conservacion y seguridad</h2>
        <p>
          Conservamos la informacion mientras tu cuenta este activa o sea necesaria para operar las
          ligas. Aplicamos medidas razonables de seguridad, aunque ningun sistema es 100% infalible.
        </p>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>
          Puedes solicitar acceso, correccion o eliminacion de tu cuenta escribiendo a{" "}
          <a href={`mailto:hola@${APP_DOMAIN}`}>hola@{APP_DOMAIN}</a>. Tambien puedes dejar de usar
          la plataforma y cerrar sesion en cualquier momento.
        </p>
      </section>

      <section>
        <h2>7. Cookies y almacenamiento local</h2>
        <p>
          Usamos almacenamiento local del navegador para preferencias basicas (por ejemplo, avisos de
          instalacion de la app) y tokens de sesion gestionados por Firebase.
        </p>
      </section>

      <section>
        <h2>8. Cambios</h2>
        <p>
          Publicaremos cambios relevantes en esta pagina. Si el cambio es significativo, lo
          comunicaremos dentro de la plataforma cuando sea posible.
        </p>
      </section>

      <p className="legal-footer-links">
        <Link to="/terminos">Terminos de uso</Link>
        <Link to="/">Volver al inicio</Link>
      </p>
    </article>
  );
}
