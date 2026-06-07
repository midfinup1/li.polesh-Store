export const metadata = {
  title: "Обработка персональных данных | lipolesh.art",
};

export default function PersonalDataPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 md:px-10">
      <p className="mb-6 text-sm uppercase tracking-widest text-ink-light">
        Документы
      </p>

      <h1 className="mb-10 font-display text-5xl">
        Согласие на обработку персональных данных
      </h1>

      <div className="space-y-8 text-sm leading-7 text-ink-light">
        <section>
          <h2 className="mb-3 text-xl text-ink">1. Согласие пользователя</h2>
          <p>
            Отправляя заявку на сайте lipolesh.art, пользователь даёт согласие
            на обработку персональных данных, указанных в форме заявки.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl text-ink">2. Состав данных</h2>
          <p>
            Обрабатываются данные, которые пользователь самостоятельно указывает
            в форме: имя, email, телефон или Telegram, комментарий к заявке.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl text-ink">3. Цель обработки</h2>
          <p>
            Данные используются для того, чтобы художница могла связаться с
            пользователем по поводу выбранной работы и обсудить детали лично.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl text-ink">4. Характер сайта</h2>
          <p>
            Сайт не является платёжной системой и не оформляет покупку
            автоматически. Отправка заявки означает только запрос на обратную
            связь.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl text-ink">5. Срок действия согласия</h2>
          <p>
            Согласие действует до достижения цели обработки или до момента его
            отзыва пользователем.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl text-ink">6. Отзыв согласия</h2>
          <p>
            Пользователь может отозвать согласие, связавшись с администратором
            сайта через контактные данные, указанные на странице «Контакты».
          </p>
        </section>
      </div>
    </main>
  );
}