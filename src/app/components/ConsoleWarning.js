"use client"; // Este arquivo será um Client Component

import { useEffect } from "react";

export default function ConsoleWarning() {
  useEffect(() => {
    const mensagemSeguranca = () => {
      const estiloTitulo = [
        "color: #ff4c4c",
        "font-size: 3rem",
        "font-weight: bold",
        "text-shadow: 2px 2px 0px black",
        "font-family: 'Georgia', serif"
      ].join(";");

      const estiloTexto = [
        "color: #ffffff",
        "font-size: 1.2rem",
        "line-height: 1.5"
      ].join(";");

      const estiloDestaque = "color: #e5b95f; font-weight: bold; font-size: 1.2rem;";

      console.clear();
      console.log("%c🛑 PARE LOGO AÍ, FORASTEIRO!", estiloTitulo);
      console.log(
        "%c\nEste console é uma ferramenta para desenvolvedores. Se alguém te pediu para colar algo aqui, " +
        "há 100% de chance de ser um golpe para roubar seus dados da %cSafra Log.%c",
        estiloTexto, 
        estiloDestaque, 
        estiloTexto
      );
      console.log(
        "%c\nSe você modificar qualquer coisa aqui, o SafraLog pode parar de funcionar e você " +
        "pode acabar perdendo seus registros de craft ou o acesso ao condado. Siga seu caminho e feche esta janela.",
        estiloTexto
      );
      console.log(
        "%c\n--- Sarah Winchester | Administradora ---",
        "color: #666; font-style: italic;"
      );
    };

    mensagemSeguranca();
  }, []);

  return null;
}