import { Link } from "react-router-dom";
import { APP_DOMAIN, APP_NAME } from "../constants/brand";

export function TermsPage() {
  return (
    <article className="legal-page">
      <p className="overline">Legal</p>
      <h1>Terminos de uso</h1>
      <p className="legal-updated">Ultima actualizacion: 7 de junio de 2026</p>

      <section>
        <h2>1. Que es {APP_NAME}</h2>
        <p>
          {APP_NAME} ({APP_DOMAIN}) es una plataforma de entretenimiento para crear quinielas privadas
          entre amigos, familiares o grupos cerrados. No es una casa de apuestas, no procesa pagos de
          apuestas y no ofrece premios en dinero por parte de la plataforma.
        </p>
      </section>

      <section>
        <h2>2. Cuenta y elegibilidad</h2>
        <p>
          Debes tener al menos 18 anos para usar {APP_NAME}. Eres responsable de mantener la
          confidencialidad de tu cuenta y de toda actividad realizada con ella. La informacion que
          proporciones debe ser veraz y actualizada.
        </p>
      </section>

      <section>
        <h2>3. Ligas privadas y premios</h2>
        <p>
          Los administradores de cada liga pueden definir reglas y premios entre los participantes.
          Esos acuerdos son responsabilidad exclusiva de los miembros de la liga. {APP_NAME} no
          administra, garantiza ni ejecuta pagos entre usuarios.
        </p>
        <p>
          Si tu liga incluye dinero u otros bienes, asegurate de cumplir las leyes aplicables en tu
          pais o region.
        </p>
      </section>

      <section>
        <h2>4. Predicciones y puntuacion</h2>
        <p>
          Las predicciones se bloquean al inicio de cada partido segun el calendario del torneo. Los
          puntos se calculan con las reglas configuradas en cada liga. Los resultados oficiales
          provienen de fuentes externas de datos del torneo.
        </p>
      </section>

      <section>
        <h2>5. Uso permitido</h2>
        <p>Te comprometes a no:</p>
        <ul>
          <li>Usar la plataforma para actividades ilegales o fraudulentas.</li>
          <li>Intentar acceder a datos de otros usuarios sin autorizacion.</li>
          <li>Manipular puntuaciones, cuentas o invitaciones de forma abusiva.</li>
          <li>Publicar contenido ofensivo, discriminatorio o que viole derechos de terceros.</li>
        </ul>
      </section>

      <section>
        <h2>6. Disponibilidad del servicio</h2>
        <p>
          {APP_NAME} se ofrece tal cual, sin garantias de disponibilidad continua. Podemos modificar,
          suspender o discontinuar funciones con aviso razonable cuando sea posible.
        </p>
      </section>

      <section>
        <h2>7. Limitacion de responsabilidad</h2>
        <p>
          En la medida permitida por la ley, {APP_NAME} no sera responsable por perdidas indirectas,
          disputas entre miembros de una liga, errores en datos de terceros o interrupciones del
          servicio.
        </p>
      </section>

      <section>
        <h2>8. Cambios y contacto</h2>
        <p>
          Podemos actualizar estos terminos. El uso continuado de la plataforma implica la aceptacion
          de la version vigente. Para dudas legales o de producto, escribe a{" "}
          <a href={`mailto:hola@${APP_DOMAIN}`}>hola@{APP_DOMAIN}</a>.
        </p>
      </section>

      <p className="legal-footer-links">
        <Link to="/privacidad">Politica de privacidad</Link>
        <Link to="/">Volver al inicio</Link>
      </p>
    </article>
  );
}
